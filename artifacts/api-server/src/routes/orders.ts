import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, ordersTable, cartTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { requireAdminSession, requirePermission, logActivity, getIp } from "../lib/admin-auth";

const router: IRouter = Router();

function formatOrder(o: any) {
  return {
    id: o.id, userId: o.userId, userName: o.userName || null, userEmail: o.userEmail || null,
    status: o.status, items: o.items || [], subtotal: parseFloat(o.subtotal), discount: parseFloat(o.discount || "0"),
    couponCode: o.couponCode || null, shipping: parseFloat(o.shipping || "0"), total: parseFloat(o.total),
    shippingAddress: o.shippingAddress, notes: o.notes || null,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, userId)).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(formatOrder));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const { shippingAddress, notes } = req.body;
  if (!shippingAddress) { res.status(400).json({ error: "shippingAddress requis" }); return; }
  const [cart] = await db.select().from(cartTable).where(eq(cartTable.userId, userId));
  if (!cart || !Array.isArray(cart.items) || (cart.items as any[]).length === 0) {
    res.status(400).json({ error: "Panier vide" }); return;
  }
  const items = cart.items as any[];
  const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const shipping = 500;
  const total = subtotal + shipping;
  const [order] = await db.insert(ordersTable).values({
    userId, status: "pending", subtotal: String(subtotal), discount: "0",
    couponCode: (cart.couponCode as string) || null, shipping: String(shipping), total: String(total),
    shippingAddress: shippingAddress as any, items: items as any, notes: notes || null,
  }).returning();
  await db.delete(cartTable).where(eq(cartTable.userId, userId));
  res.status(201).json(formatOrder(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const userId = (req as any).userId;
  const userRole = (req as any).userRole;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Commande non trouvée" }); return; }
  if (order.userId !== userId && userRole !== "admin" && userRole !== "staff") {
    res.status(403).json({ error: "Accès refusé" }); return;
  }
  res.json(formatOrder(order));
});

// Admin routes
router.get("/admin/orders", requireAdminSession, requirePermission("manage_orders"), async (req, res): Promise<void> => {
  const { page = "1", limit = "20", status } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;
  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(whereClause);
  const orders = await db.select({
    order: ordersTable, userName: usersTable.name, userEmail: usersTable.email
  }).from(ordersTable).leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(whereClause).orderBy(desc(ordersTable.createdAt)).limit(limitNum).offset(offset);
  res.json({ orders: orders.map((o) => formatOrder({ ...o.order, userName: o.userName, userEmail: o.userEmail })), total: count, page: pageNum, totalPages: Math.ceil(count / limitNum) });
});

router.patch("/admin/orders/:id/status", requireAdminSession, requirePermission("manage_orders"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "status requis" }); return; }
  const [old] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Commande non trouvée" }); return; }
  await logActivity(req.adminUser!.id, req.adminUser!.fullName, "update_order_status", "order", id, { status: old?.status }, { status }, getIp(req));
  res.json(formatOrder(order));
});

export default router;
