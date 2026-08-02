import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import { requireAdminSession, requirePermission, logActivity, getIp } from "../lib/admin-auth";

const router: IRouter = Router();

router.get("/banners", async (_req, res): Promise<void> => {
  const banners = await db.select().from(bannersTable).where(eq(bannersTable.isActive, true)).orderBy(bannersTable.sortOrder);
  res.json(banners);
});

// Admin: list all banners (including inactive)
router.get("/admin/banners", requireAdminSession, requirePermission("manage_banners"), async (_req, res): Promise<void> => {
  const banners = await db.select().from(bannersTable).orderBy(bannersTable.sortOrder);
  res.json(banners);
});

router.post("/banners", requireAdminSession, requirePermission("manage_banners"), async (req, res): Promise<void> => {
  const { title, subtitle, imageUrl, linkUrl, buttonText, isActive, sortOrder } = req.body;
  if (!title) { res.status(400).json({ error: "title requis" }); return; }
  const [banner] = await db.insert(bannersTable).values({ title, subtitle, imageUrl, linkUrl, buttonText, isActive: isActive !== false, sortOrder: sortOrder || 0 }).returning();
  await logActivity(req.adminUser!.id, req.adminUser!.fullName, "create_banner", "banner", banner.id, null, { title: banner.title }, getIp(req));
  res.status(201).json(banner);
});

router.patch("/banners/:id", requireAdminSession, requirePermission("manage_banners"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const updates: Record<string, unknown> = {};
  const fields = ["title", "subtitle", "imageUrl", "linkUrl", "buttonText", "isActive", "sortOrder"];
  for (const f of fields) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
  const [banner] = await db.update(bannersTable).set(updates).where(eq(bannersTable.id, id)).returning();
  if (!banner) { res.status(404).json({ error: "Bannière non trouvée" }); return; }
  await logActivity(req.adminUser!.id, req.adminUser!.fullName, "update_banner", "banner", id, null, updates, getIp(req));
  res.json(banner);
});

router.delete("/banners/:id", requireAdminSession, requirePermission("manage_banners"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(bannersTable).where(eq(bannersTable.id, id));
  await logActivity(req.adminUser!.id, req.adminUser!.fullName, "delete_banner", "banner", id, null, null, getIp(req));
  res.json({ message: "Bannière supprimée" });
});

export default router;
