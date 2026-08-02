import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/banners", async (_req, res): Promise<void> => {
  const banners = await db.select().from(bannersTable).where(eq(bannersTable.isActive, true)).orderBy(bannersTable.sortOrder);
  res.json(banners);
});

router.post("/banners", requireAdmin, async (req, res): Promise<void> => {
  const { title, subtitle, imageUrl, linkUrl, buttonText, isActive, sortOrder } = req.body;
  if (!title) { res.status(400).json({ error: "title requis" }); return; }
  const [banner] = await db.insert(bannersTable).values({ title, subtitle, imageUrl, linkUrl, buttonText, isActive: isActive !== false, sortOrder: sortOrder || 0 }).returning();
  res.status(201).json(banner);
});

router.patch("/banners/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const updates: Record<string, unknown> = {};
  const fields = ["title", "subtitle", "imageUrl", "linkUrl", "buttonText", "isActive", "sortOrder"];
  for (const f of fields) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
  const [banner] = await db.update(bannersTable).set(updates).where(eq(bannersTable.id, id)).returning();
  if (!banner) { res.status(404).json({ error: "Bannière non trouvée" }); return; }
  res.json(banner);
});

router.delete("/banners/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(bannersTable).where(eq(bannersTable.id, id));
  res.json({ message: "Bannière supprimée" });
});

export default router;
