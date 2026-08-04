import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, ordersTable, cartTable, usersTable, shippingRatesTable, shippingOfficesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { requireAdminSession, requirePermission, logActivity, getIp } from "../lib/admin-auth";

const router: IRouter = Router();

/**
 * Safe column set that excludes NOEST delivery columns added in migration 0001.
 * Using `ordersTable` directly in db.select() generates an explicit column list;
 * if the production DB hasn't run the migration yet it throws "column does not exist".
 * Once the migration is applied on production this guard can be removed.
 */
const baseOrderCols = {
  id: ordersTable.id,
  idempotencyKey: ordersTable.idempotencyKey,
  userId: ordersTable.userId,
  status: ordersTable.status,
  paymentMethod: ordersTable.paymentMethod,
  paymentStatus: ordersTable.paymentStatus,
  paymentProofUrl: ordersTable.paymentProofUrl,
  paymentNotes: ordersTable.paymentNotes,
  subtotal: ordersTable.subtotal,
  discount: ordersTable.discount,
  couponCode: ordersTable.couponCode,
  shipping: ordersTable.shipping,
  total: ordersTable.total,
  shippingAddress: ordersTable.shippingAddress,
  items: ordersTable.items,
  notes: ordersTable.notes,
  createdAt: ordersTable.createdAt,
  updatedAt: ordersTable.updatedAt,
  // Shipping metadata (migration 0003)
  deliveryType: ordersTable.deliveryType,
  shippingWilayaCode: ordersTable.shippingWilayaCode,
  shippingWilayaName: ordersTable.shippingWilayaName,
  shippingOfficeId: ordersTable.shippingOfficeId,
  shippingOfficeName: ordersTable.shippingOfficeName,
  estimatedDeliveryMinDays: ordersTable.estimatedDeliveryMinDays,
  estimatedDeliveryMaxDays: ordersTable.estimatedDeliveryMaxDays,
} as const;

function formatOrder(o: any) {
  return {
    id: o.id, userId: o.userId, userName: o.userName || null, userEmail: o.userEmail || null,
    status: o.status,
    paymentMethod: o.paymentMethod || "cash_on_delivery",
    paymentStatus: o.paymentStatus || "pending",
    paymentProofUrl: o.paymentProofUrl || null,
    paymentNotes: o.paymentNotes || null,
    items: o.items || [], subtotal: parseFloat(o.subtotal), discount: parseFloat(o.discount || "0"),
    couponCode: o.couponCode || null, shipping: parseFloat(o.shipping || "0"), total: parseFloat(o.total),
    shippingAddress: o.shippingAddress, notes: o.notes || null,
    deliveryType: o.deliveryType || null,
    shippingWilayaCode: o.shippingWilayaCode || null,
    shippingWilayaName: o.shippingWilayaName || null,
    shippingOfficeId: o.shippingOfficeId || null,
    shippingOfficeName: o.shippingOfficeName || null,
    estimatedDeliveryMinDays: o.estimatedDeliveryMinDays || null,
    estimatedDeliveryMaxDays: o.estimatedDeliveryMaxDays || null,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
  };
}

/** Compute shipping cost server-side from shipping_rates. Never trusts frontend price. */
async function computeShipping(
  wilayaCode: string | undefined, deliveryType: string | undefined, officeId: number | undefined,
): Promise<{ shipping: number; meta: Record<string, unknown> }> {
  const fallback = { shipping: 500, meta: {} };
  if (!wilayaCode || !deliveryType) return fallback;
  const code = String(wilayaCode).padStart(2, "0");
  try {
    const [rate] = await db.select().from(shippingRatesTable).where(eq(shippingRatesTable.wilayaCode, code));
    if (!rate || !rate.isActive) return fallback;
    let price: number;
    if (deliveryType === "domicile" && rate.homeDeliveryEnabled) price = rate.homeDeliveryPrice;
    else if (deliveryType === "stop_desk" && rate.stopDeskEnabled) price = rate.stopDeskPrice;
    else return fallback;
    const meta: Record<string, unknown> = {
      deliveryType, shippingWilayaCode: code, shippingWilayaName: rate.wilayaName,
      estimatedDeliveryMinDays: rate.minDeliveryDays, estimatedDeliveryMaxDays: rate.maxDeliveryDays,
    };
    if (officeId && deliveryType === "stop_desk") {
      const [off] = await db.select({ id: shippingOfficesTable.id, name: shippingOfficesTable.name })
        .from(shippingOfficesTable).where(eq(shippingOfficesTable.id, Number(officeId)));
      if (off) { meta.shippingOfficeId = off.id; meta.shippingOfficeName = off.name; }
    }
    return { shipping: price, meta };
  } catch { return fallback; }
}

// ── Guest order (no auth required) ──────────────────────────────────────────
router.post("/orders/guest", async (req, res): Promise<void> => {
  const { items, shippingAddress, notes, paymentMethod, idempotencyKey, deliveryType, wilayaCode, officeId } = req.body;
  if (!shippingAddress || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "items et shippingAddress requis" }); return;
  }
  const validPaymentMethods = ["cash_on_delivery", "bank_transfer", "cib_edahabia"];
  const resolvedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : "cash_on_delivery";
  const subtotal = items.reduce((s: number, i: any) => s + (Number(i.price) * Number(i.quantity)), 0);
  const { shipping, meta: shippingMeta } = await computeShipping(wilayaCode, deliveryType, officeId);
  const total = subtotal + shipping;
  const initialPaymentStatus = resolvedPaymentMethod === "cash_on_delivery" ? "pending" : "awaiting_confirmation";
  const [order] = await db.insert(ordersTable).values({
    idempotencyKey: idempotencyKey || null,
    userId: null, // guest — no account
    status: "pending",
    paymentMethod: resolvedPaymentMethod,
    paymentStatus: initialPaymentStatus,
    subtotal: String(subtotal), discount: "0",
    couponCode: null, shipping: String(shipping), total: String(total),
    shippingAddress: shippingAddress as any, items: items as any, notes: notes || null,
    ...shippingMeta as any,
  }).returning(baseOrderCols);
  res.status(201).json(formatOrder(order));
});

// Guest: submit payment proof by order ID (no account needed)
router.patch("/orders/guest/:id/payment-proof", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { paymentProofUrl } = req.body;
  if (!paymentProofUrl) { res.status(400).json({ error: "paymentProofUrl requis" }); return; }
  const [order] = await db.select(baseOrderCols).from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Commande non trouvée" }); return; }
  if (order.userId !== null) { res.status(403).json({ error: "Utilisez l'endpoint authentifié" }); return; }
  const [updated] = await db.update(ordersTable)
    .set({ paymentProofUrl, paymentStatus: "awaiting_confirmation" })
    .where(eq(ordersTable.id, id)).returning(baseOrderCols);
  res.json(formatOrder(updated));
});

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const orders = await db.select(baseOrderCols).from(ordersTable).where(eq(ordersTable.userId, userId)).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(formatOrder));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const { shippingAddress, notes, paymentMethod, idempotencyKey, deliveryType, wilayaCode, officeId } = req.body;
  if (!shippingAddress) { res.status(400).json({ error: "shippingAddress requis" }); return; }

  const validPaymentMethods = ["cash_on_delivery", "bank_transfer", "cib_edahabia"];
  const resolvedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : "cash_on_delivery";

  const [cart] = await db.select().from(cartTable).where(eq(cartTable.userId, userId));
  if (!cart || !Array.isArray(cart.items) || (cart.items as any[]).length === 0) {
    res.status(400).json({ error: "Panier vide" }); return;
  }
  const items = cart.items as any[];
  const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const { shipping, meta: shippingMeta } = await computeShipping(wilayaCode, deliveryType, officeId);
  const total = subtotal + shipping;

  // Payment status: bank_transfer starts as "awaiting_confirmation", others as "pending"
  const initialPaymentStatus = resolvedPaymentMethod === "cash_on_delivery" ? "pending" : "awaiting_confirmation";

  // Atomic idempotency: INSERT ... ON CONFLICT DO NOTHING.
  // If the insert is skipped (duplicate key), the returning array is empty — we then fetch
  // the already-existing order. This is race-safe: concurrent retries both resolve to the
  // same row rather than one crashing with a unique-constraint error.
  const [order] = await db.insert(ordersTable).values({
    idempotencyKey: idempotencyKey || null,
    userId, status: "pending",
    paymentMethod: resolvedPaymentMethod,
    paymentStatus: initialPaymentStatus,
    subtotal: String(subtotal), discount: "0",
    couponCode: (cart.couponCode as string) || null, shipping: String(shipping), total: String(total),
    shippingAddress: shippingAddress as any, items: items as any, notes: notes || null,
    ...shippingMeta as any,
  }).onConflictDoNothing().returning(baseOrderCols);

  if (!order) {
    // Duplicate request — idempotencyKey already used for this user; return the existing order
    const [existing] = await db.select(baseOrderCols).from(ordersTable)
      .where(and(eq(ordersTable.userId, userId), eq(ordersTable.idempotencyKey, idempotencyKey)));
    if (!existing) { res.status(500).json({ error: "Erreur idempotence" }); return; }
    res.status(200).json(formatOrder(existing));
    return;
  }

  await db.delete(cartTable).where(eq(cartTable.userId, userId));
  res.status(201).json(formatOrder(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const userId = (req as any).userId;
  const userRole = (req as any).userRole;
  const [order] = await db.select(baseOrderCols).from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Commande non trouvée" }); return; }
  if (order.userId !== userId && userRole !== "admin" && userRole !== "staff") {
    res.status(403).json({ error: "Accès refusé" }); return;
  }
  res.json(formatOrder(order));
});

// Customer: submit payment proof (for bank_transfer)
router.patch("/orders/:id/payment-proof", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const userId = (req as any).userId;
  const { paymentProofUrl } = req.body;

  if (!paymentProofUrl) { res.status(400).json({ error: "paymentProofUrl requis" }); return; }

  const [order] = await db.select(baseOrderCols).from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Commande non trouvée" }); return; }
  if (order.userId !== userId) { res.status(403).json({ error: "Accès refusé" }); return; }
  if (order.paymentMethod !== "bank_transfer") {
    res.status(400).json({ error: "Preuve de paiement uniquement pour virement bancaire" }); return;
  }

  const [updated] = await db.update(ordersTable)
    .set({ paymentProofUrl, paymentStatus: "awaiting_confirmation" })
    .where(eq(ordersTable.id, id))
    .returning(baseOrderCols);
  res.json(formatOrder(updated));
});

// Admin routes
router.get("/admin/orders", requireAdminSession, requirePermission("manage_orders"), async (req, res): Promise<void> => {
  const { page = "1", limit = "20", status, paymentStatus } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;
  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (paymentStatus) conditions.push(eq(ordersTable.paymentStatus, paymentStatus));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(whereClause);
  const orders = await db.select({
    order: baseOrderCols, userName: usersTable.name, userEmail: usersTable.email
  }).from(ordersTable).leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(whereClause).orderBy(desc(ordersTable.createdAt)).limit(limitNum).offset(offset);
  res.json({ orders: orders.map((o) => formatOrder({ ...o.order, userName: o.userName, userEmail: o.userEmail })), total: count, page: pageNum, totalPages: Math.ceil(count / limitNum) });
});

router.patch("/admin/orders/:id/status", requireAdminSession, requirePermission("manage_orders"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "status requis" }); return; }
  const [old] = await db.select(baseOrderCols).from(ordersTable).where(eq(ordersTable.id, id));
  const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning(baseOrderCols);
  if (!order) { res.status(404).json({ error: "Commande non trouvée" }); return; }
  await logActivity(req.adminUser!.id, req.adminUser!.fullName, "update_order_status", "order", id, { status: old?.status }, { status }, getIp(req));
  res.json(formatOrder(order));
});

// Admin: confirm or reject payment
router.patch("/admin/orders/:id/payment", requireAdminSession, requirePermission("manage_orders"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { paymentStatus, paymentNotes } = req.body;

  const validStatuses = ["pending", "awaiting_confirmation", "confirmed", "failed"];
  if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
    res.status(400).json({ error: "paymentStatus invalide" }); return;
  }

  const [old] = await db.select(baseOrderCols).from(ordersTable).where(eq(ordersTable.id, id));
  if (!old) { res.status(404).json({ error: "Commande non trouvée" }); return; }

  const updates: Record<string, unknown> = { paymentStatus };
  if (paymentNotes !== undefined) updates.paymentNotes = paymentNotes;

  // Auto-confirm order when payment is confirmed
  if (paymentStatus === "confirmed" && old.status === "pending") {
    updates.status = "confirmed";
  }

  const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning(baseOrderCols);
  await logActivity(req.adminUser!.id, req.adminUser!.fullName, "update_payment_status", "order", id,
    { paymentStatus: old.paymentStatus }, { paymentStatus, paymentNotes }, getIp(req));
  res.json(formatOrder(order));
});

export default router;
