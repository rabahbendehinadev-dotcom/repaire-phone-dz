import { Router, type IRouter } from "express";
import { eq, and, asc } from "drizzle-orm";
import { db, shippingRatesTable, shippingOfficesTable } from "@workspace/db";
import { requireAdminSession, requirePermission, logActivity, getIp } from "../lib/admin-auth";

const router: IRouter = Router();

// ══════════════════════════════════════════════════════════════
// PUBLIC — used by the storefront checkout
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/shipping/wilayas
 * Returns all active wilayas with their delivery options and prices.
 * Used by the checkout to know which wilayas are available.
 */
router.get("/shipping/wilayas", async (_req, res): Promise<void> => {
  const rates = await db.select().from(shippingRatesTable)
    .where(eq(shippingRatesTable.isActive, true))
    .orderBy(asc(shippingRatesTable.wilayaCode));
  res.json({ wilayas: rates });
});

/**
 * GET /api/shipping/wilayas/:code
 * Returns the full rate details for one wilaya (active or not).
 */
router.get("/shipping/wilayas/:code", async (req, res): Promise<void> => {
  const code = (req.params.code as string).padStart(2, "0");
  const [rate] = await db.select().from(shippingRatesTable).where(eq(shippingRatesTable.wilayaCode, code));
  if (!rate) { res.status(404).json({ error: "Wilaya non trouvée" }); return; }
  res.json(rate);
});

/** GET /api/shipping/rates/:wilayaCode — rate for one wilaya (kept for compat) */
router.get("/shipping/rates/:wilayaCode", async (req, res): Promise<void> => {
  const code = (req.params.wilayaCode as string).padStart(2, "0");
  const [rate] = await db.select().from(shippingRatesTable).where(eq(shippingRatesTable.wilayaCode, code));
  if (!rate || !rate.isActive) {
    res.json({ wilayaCode: code, wilayaName: code, isActive: false, homeDeliveryEnabled: false, stopDeskEnabled: false, homeDeliveryPrice: 500, stopDeskPrice: 0, minDeliveryDays: 2, maxDeliveryDays: 5 });
    return;
  }
  res.json(rate);
});

/**
 * GET /api/shipping/offices?wilayaCode=16  (also accepts ?wilaya=16 for backwards compat)
 * Returns active stop-desk offices for a wilaya.
 */
router.get("/shipping/offices", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string | undefined>;
  const raw = q.wilayaCode ?? q.wilaya;
  const wilaya = raw?.padStart(2, "0");
  const conditions = [eq(shippingOfficesTable.isActive, true)];
  if (wilaya) conditions.push(eq(shippingOfficesTable.wilayaCode, wilaya));
  const offices = await db.select().from(shippingOfficesTable).where(and(...conditions)).orderBy(asc(shippingOfficesTable.name));
  res.json({ offices });
});

// ══════════════════════════════════════════════════════════════
// ADMIN — requires manage_shipping_rates permission
// ══════════════════════════════════════════════════════════════

const guard = [requireAdminSession, requirePermission("manage_shipping_rates")] as const;

/** GET /api/admin/shipping-rates — all 58 wilaya rates */
router.get("/admin/shipping-rates", ...guard, async (_req, res): Promise<void> => {
  const rates = await db.select().from(shippingRatesTable).orderBy(asc(shippingRatesTable.wilayaCode));
  res.json({ rates });
});

/** PUT /api/admin/shipping-rates/:wilayaCode — update one rate */
router.put("/admin/shipping-rates/:wilayaCode", ...guard, async (req, res): Promise<void> => {
  const code = (req.params.wilayaCode as string).padStart(2, "0");
  const {
    isActive, homeDeliveryEnabled, stopDeskEnabled,
    homeDeliveryPrice, stopDeskPrice, minDeliveryDays, maxDeliveryDays,
  } = req.body as Record<string, any>;

  // Validation
  if (homeDeliveryEnabled && (homeDeliveryPrice == null || Number(homeDeliveryPrice) < 0)) {
    res.status(400).json({ error: "Prix domicile invalide (doit être ≥ 0)" }); return;
  }
  if (stopDeskEnabled && (stopDeskPrice == null || Number(stopDeskPrice) < 0)) {
    res.status(400).json({ error: "Prix bureau invalide (doit être ≥ 0)" }); return;
  }
  if (Number(minDeliveryDays) > Number(maxDeliveryDays)) {
    res.status(400).json({ error: "Délai minimum ne peut pas être supérieur au délai maximum" }); return;
  }

  const updates = {
    isActive: Boolean(isActive),
    homeDeliveryEnabled: Boolean(homeDeliveryEnabled),
    stopDeskEnabled: Boolean(stopDeskEnabled),
    homeDeliveryPrice: Math.round(Number(homeDeliveryPrice)),
    stopDeskPrice: Math.round(Number(stopDeskPrice)),
    minDeliveryDays: Math.round(Number(minDeliveryDays)) || 1,
    maxDeliveryDays: Math.round(Number(maxDeliveryDays)) || 3,
  };

  const [rate] = await db.update(shippingRatesTable).set(updates).where(eq(shippingRatesTable.wilayaCode, code)).returning();
  if (!rate) { res.status(404).json({ error: "Wilaya non trouvée" }); return; }
  await logActivity(req.adminUser!.id, req.adminUser!.fullName, "update_shipping_rate", "shipping_rate", 0, { code }, updates, getIp(req));
  res.json(rate);
});

/** POST /api/admin/shipping-rates/bulk — bulk action on multiple wilayas */
router.post("/admin/shipping-rates/bulk", ...guard, async (req, res): Promise<void> => {
  const { action, wilayaCodes, value } = req.body as { action: string; wilayaCodes: string[]; value?: any };
  if (!Array.isArray(wilayaCodes) || wilayaCodes.length === 0) {
    res.status(400).json({ error: "wilayaCodes requis" }); return;
  }
  if (!action) { res.status(400).json({ error: "action requise" }); return; }

  let updatedCount = 0;

  for (const code of wilayaCodes) {
    const paddedCode = code.padStart(2, "0");
    let updates: Record<string, any> = {};

    if (action === "activate")    updates = { isActive: true };
    else if (action === "deactivate") updates = { isActive: false };
    else if (action === "enable_home") updates = { homeDeliveryEnabled: true };
    else if (action === "enable_desk") updates = { stopDeskEnabled: true };
    else if (action === "set_home_price") {
      const price = Math.round(Number(value));
      if (isNaN(price) || price < 0) continue;
      updates = { homeDeliveryPrice: price };
    }
    else if (action === "set_desk_price") {
      const price = Math.round(Number(value));
      if (isNaN(price) || price < 0) continue;
      updates = { stopDeskPrice: price };
    }
    else if (action === "set_min_days") {
      const days = Math.round(Number(value));
      if (isNaN(days) || days < 1) continue;
      updates = { minDeliveryDays: days };
    }
    else if (action === "set_max_days") {
      const days = Math.round(Number(value));
      if (isNaN(days) || days < 1) continue;
      updates = { maxDeliveryDays: days };
    }
    else if (action === "percent_change") {
      const pct = Number(value);
      if (isNaN(pct)) continue;
      const [existing] = await db.select({ h: shippingRatesTable.homeDeliveryPrice, d: shippingRatesTable.stopDeskPrice }).from(shippingRatesTable).where(eq(shippingRatesTable.wilayaCode, paddedCode));
      if (!existing) continue;
      updates = {
        homeDeliveryPrice: Math.max(0, Math.round(existing.h * (1 + pct / 100))),
        stopDeskPrice:     Math.max(0, Math.round(existing.d * (1 + pct / 100))),
      };
    }
    else if (action === "update_many") {
      // value is the full rate object
      const { isActive, homeDeliveryEnabled, stopDeskEnabled, homeDeliveryPrice, stopDeskPrice, minDeliveryDays, maxDeliveryDays } = value ?? {};
      updates = { isActive, homeDeliveryEnabled, stopDeskEnabled, homeDeliveryPrice, stopDeskPrice, minDeliveryDays, maxDeliveryDays };
    }
    else continue;

    if (Object.keys(updates).length === 0) continue;
    const result = await db.update(shippingRatesTable).set(updates).where(eq(shippingRatesTable.wilayaCode, paddedCode)).returning({ id: shippingRatesTable.id });
    if (result.length > 0) updatedCount++;
  }

  await logActivity(req.adminUser!.id, req.adminUser!.fullName, "bulk_update_shipping_rates", "shipping_rate", 0, { action, count: wilayaCodes.length }, { updatedCount }, getIp(req));
  res.json({ updated: updatedCount });
});

/** POST /api/admin/shipping-rates/seed — ensure all 58 wilayas exist in the DB */
router.post("/admin/shipping-rates/seed", ...guard, async (req, res): Promise<void> => {
  const SEED: Array<{ code: string; name: string; home: number; desk: number; min: number; max: number }> = [
    { code: "01", name: "Adrar",                home: 1000, desk: 750, min: 4, max: 7 },
    { code: "02", name: "Chlef",                home: 650,  desk: 450, min: 2, max: 3 },
    { code: "03", name: "Laghouat",             home: 800,  desk: 600, min: 3, max: 5 },
    { code: "04", name: "Oum El Bouaghi",       home: 650,  desk: 450, min: 2, max: 3 },
    { code: "05", name: "Batna",                home: 650,  desk: 450, min: 2, max: 3 },
    { code: "06", name: "Béjaïa",             home: 600,  desk: 400, min: 1, max: 2 },
    { code: "07", name: "Biskra",               home: 800,  desk: 600, min: 3, max: 5 },
    { code: "08", name: "Béchar",             home: 1000, desk: 750, min: 4, max: 7 },
    { code: "09", name: "Blida",                home: 500,  desk: 350, min: 1, max: 2 },
    { code: "10", name: "Bouira",               home: 650,  desk: 450, min: 2, max: 3 },
    { code: "11", name: "Tamanrasset",          home: 800,  desk: 600, min: 3, max: 5 },
    { code: "12", name: "Tébessa",            home: 650,  desk: 450, min: 2, max: 3 },
    { code: "13", name: "Tlemcen",              home: 600,  desk: 400, min: 1, max: 2 },
    { code: "14", name: "Tiaret",               home: 650,  desk: 450, min: 2, max: 3 },
    { code: "15", name: "Tizi Ouzou",           home: 600,  desk: 400, min: 1, max: 2 },
    { code: "16", name: "Alger",                home: 500,  desk: 350, min: 1, max: 2 },
    { code: "17", name: "Djelfa",               home: 800,  desk: 600, min: 3, max: 5 },
    { code: "18", name: "Jijel",                home: 650,  desk: 450, min: 2, max: 3 },
    { code: "19", name: "Sétif",              home: 600,  desk: 400, min: 1, max: 2 },
    { code: "20", name: "Saïda",             home: 650,  desk: 450, min: 2, max: 3 },
    { code: "21", name: "Skikda",               home: 600,  desk: 400, min: 1, max: 2 },
    { code: "22", name: "Sidi Bel Abbès",     home: 600,  desk: 400, min: 1, max: 2 },
    { code: "23", name: "Annaba",               home: 600,  desk: 400, min: 1, max: 2 },
    { code: "24", name: "Guelma",               home: 650,  desk: 450, min: 2, max: 3 },
    { code: "25", name: "Constantine",          home: 600,  desk: 400, min: 1, max: 2 },
    { code: "26", name: "Médéa",             home: 650,  desk: 450, min: 2, max: 3 },
    { code: "27", name: "Mostaganem",           home: 650,  desk: 450, min: 2, max: 3 },
    { code: "28", name: "M'Sila",              home: 800,  desk: 600, min: 3, max: 5 },
    { code: "29", name: "Mascara",              home: 650,  desk: 450, min: 2, max: 3 },
    { code: "30", name: "Ouargla",              home: 800,  desk: 600, min: 3, max: 5 },
    { code: "31", name: "Oran",                 home: 600,  desk: 400, min: 1, max: 2 },
    { code: "32", name: "El Bayadh",            home: 800,  desk: 600, min: 3, max: 5 },
    { code: "33", name: "Illizi",               home: 800,  desk: 600, min: 3, max: 5 },
    { code: "34", name: "Bordj Bou Arréridj", home: 650,  desk: 450, min: 2, max: 3 },
    { code: "35", name: "Boumerdès",          home: 500,  desk: 350, min: 1, max: 2 },
    { code: "36", name: "El Tarf",              home: 650,  desk: 450, min: 2, max: 3 },
    { code: "37", name: "Tindouf",              home: 800,  desk: 600, min: 3, max: 5 },
    { code: "38", name: "Tissemsilt",           home: 650,  desk: 450, min: 2, max: 3 },
    { code: "39", name: "El Oued",              home: 800,  desk: 600, min: 3, max: 5 },
    { code: "40", name: "Khenchela",            home: 800,  desk: 600, min: 3, max: 5 },
    { code: "41", name: "Souk Ahras",           home: 650,  desk: 450, min: 2, max: 3 },
    { code: "42", name: "Tipaza",               home: 500,  desk: 350, min: 1, max: 2 },
    { code: "43", name: "Mila",                 home: 650,  desk: 450, min: 2, max: 3 },
    { code: "44", name: "Aïn Defla",          home: 650,  desk: 450, min: 2, max: 3 },
    { code: "45", name: "Naâma",             home: 650,  desk: 450, min: 2, max: 3 },
    { code: "46", name: "Aïn Témouchent",    home: 650,  desk: 450, min: 2, max: 3 },
    { code: "47", name: "Ghardaïa",           home: 800,  desk: 600, min: 3, max: 5 },
    { code: "48", name: "Relizane",             home: 650,  desk: 450, min: 2, max: 3 },
    { code: "49", name: "Timimoun",             home: 1000, desk: 750, min: 4, max: 7 },
    { code: "50", name: "Bordj Badji Mokhtar", home: 1000, desk: 750, min: 4, max: 7 },
    { code: "51", name: "Ouled Djellal",        home: 1000, desk: 750, min: 4, max: 7 },
    { code: "52", name: "Béni Abbès",         home: 1000, desk: 750, min: 4, max: 7 },
    { code: "53", name: "In Salah",             home: 1000, desk: 750, min: 4, max: 7 },
    { code: "54", name: "In Guezzam",           home: 1000, desk: 750, min: 4, max: 7 },
    { code: "55", name: "Touggourt",            home: 1000, desk: 750, min: 4, max: 7 },
    { code: "56", name: "Djanet",               home: 1000, desk: 750, min: 4, max: 7 },
    { code: "57", name: "El M'Ghair",          home: 1000, desk: 750, min: 4, max: 7 },
    { code: "58", name: "El Meniaa",            home: 1000, desk: 750, min: 4, max: 7 },
  ];

  let inserted = 0;
  for (const w of SEED) {
    const result = await db.insert(shippingRatesTable).values({
      wilayaCode: w.code, wilayaName: w.name,
      homeDeliveryPrice: w.home, stopDeskPrice: w.desk,
      minDeliveryDays: w.min, maxDeliveryDays: w.max,
    }).onConflictDoNothing().returning({ id: shippingRatesTable.id });
    if (result.length > 0) inserted++;
  }
  res.json({ inserted, total: SEED.length, message: `${inserted} wilaya(s) initialisée(s)` });
});

// ── Shipping offices (admin) ──────────────────────────────────

/** GET /api/admin/shipping-offices */
router.get("/admin/shipping-offices", ...guard, async (req, res): Promise<void> => {
  const { wilaya } = req.query as Record<string, string>;
  const conditions = [];
  if (wilaya) conditions.push(eq(shippingOfficesTable.wilayaCode, wilaya.padStart(2, "0")));
  const offices = conditions.length
    ? await db.select().from(shippingOfficesTable).where(and(...conditions)).orderBy(asc(shippingOfficesTable.wilayaCode), asc(shippingOfficesTable.name))
    : await db.select().from(shippingOfficesTable).orderBy(asc(shippingOfficesTable.wilayaCode), asc(shippingOfficesTable.name));
  res.json({ offices });
});

/** POST /api/admin/shipping-offices */
router.post("/admin/shipping-offices", ...guard, async (req, res): Promise<void> => {
  const { wilayaCode, name, commune, address, phone, openingHours, carrier, externalOfficeId, isActive } = req.body;
  if (!wilayaCode || !name) { res.status(400).json({ error: "wilayaCode et name requis" }); return; }
  const [office] = await db.insert(shippingOfficesTable).values({
    wilayaCode: String(wilayaCode).padStart(2, "0"), name: String(name),
    commune: commune ?? null, address: address ?? null, phone: phone ?? null,
    openingHours: openingHours ?? null, carrier: carrier ?? "manual",
    externalOfficeId: externalOfficeId ?? null, isActive: isActive !== false,
  }).returning();
  await logActivity(req.adminUser!.id, req.adminUser!.fullName, "create_shipping_office", "shipping_office", office.id, null, { name, wilayaCode }, getIp(req));
  res.status(201).json(office);
});

/** PUT /api/admin/shipping-offices/:id */
router.put("/admin/shipping-offices/:id", ...guard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { wilayaCode, name, commune, address, phone, openingHours, carrier, externalOfficeId, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (wilayaCode !== undefined) updates.wilayaCode = String(wilayaCode).padStart(2, "0");
  if (name !== undefined) updates.name = String(name);
  if (commune !== undefined) updates.commune = commune;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (openingHours !== undefined) updates.openingHours = openingHours;
  if (carrier !== undefined) updates.carrier = carrier;
  if (externalOfficeId !== undefined) updates.externalOfficeId = externalOfficeId;
  if (isActive !== undefined) updates.isActive = Boolean(isActive);

  const [office] = await db.update(shippingOfficesTable).set(updates).where(eq(shippingOfficesTable.id, id)).returning();
  if (!office) { res.status(404).json({ error: "Bureau non trouvé" }); return; }
  res.json(office);
});

/** DELETE /api/admin/shipping-offices/:id */
router.delete("/admin/shipping-offices/:id", ...guard, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const [office] = await db.delete(shippingOfficesTable).where(eq(shippingOfficesTable.id, id)).returning({ name: shippingOfficesTable.name });
  if (!office) { res.status(404).json({ error: "Bureau non trouvé" }); return; }
  await logActivity(req.adminUser!.id, req.adminUser!.fullName, "delete_shipping_office", "shipping_office", id, { name: office.name }, null, getIp(req));
  res.json({ ok: true });
});

export default router;
