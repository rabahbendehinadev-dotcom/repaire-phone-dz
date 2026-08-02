import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, cartTable, productsTable, couponsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

interface CartItem {
  productId: number;
  name: string;
  price: number;
  comparePrice: number | null;
  quantity: number;
  images: string[];
  stock: number;
}

async function getUserCart(userId: number) {
  const [cart] = await db.select().from(cartTable).where(eq(cartTable.userId, userId));
  return cart;
}

async function computeCartTotals(items: CartItem[], couponCode: string | null, shippingCost: number) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let couponDiscount = 0;
  if (couponCode) {
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, couponCode));
    if (coupon && coupon.isActive) {
      if (coupon.discountType === "percentage") couponDiscount = subtotal * parseFloat(coupon.discountValue) / 100;
      else couponDiscount = parseFloat(coupon.discountValue);
    }
  }
  const discount = Math.min(couponDiscount, subtotal);
  const total = subtotal - discount + shippingCost;
  return { subtotal, discount, couponDiscount, shipping: shippingCost, total };
}

function buildResponse(items: CartItem[], couponCode: string | null, totals: ReturnType<typeof computeCartTotals> extends Promise<infer T> ? T : never) {
  return { items, subtotal: totals.subtotal, discount: totals.discount, couponCode, couponDiscount: totals.couponDiscount, shipping: totals.shipping, total: totals.total, itemCount: items.reduce((s, i) => s + i.quantity, 0) };
}

const SHIPPING_COST = 500;

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const cart = await getUserCart(userId);
  const items: CartItem[] = (cart?.items as CartItem[]) || [];
  const couponCode = (cart?.couponCode as string | null) || null;
  const totals = await computeCartTotals(items, couponCode, SHIPPING_COST);
  res.json(buildResponse(items, couponCode, totals));
});

router.delete("/cart", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  await db.delete(cartTable).where(eq(cartTable.userId, userId));
  res.json({ message: "Panier vidé" });
});

router.post("/cart/items", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const { productId, quantity } = req.body;
  if (!productId || !quantity) { res.status(400).json({ error: "productId et quantity requis" }); return; }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) { res.status(404).json({ error: "Produit non trouvé" }); return; }

  const cart = await getUserCart(userId);
  let items: CartItem[] = (cart?.items as CartItem[]) || [];
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx >= 0) {
    items[idx].quantity = Math.min(items[idx].quantity + quantity, product.stock);
  } else {
    items.push({ productId, name: product.name, price: parseFloat(product.price), comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : null, quantity: Math.min(quantity, product.stock), images: product.images || [], stock: product.stock });
  }
  const couponCode = (cart?.couponCode as string | null) || null;
  if (cart) {
    await db.update(cartTable).set({ items: items as any }).where(eq(cartTable.userId, userId));
  } else {
    await db.insert(cartTable).values({ userId, items: items as any });
  }
  const totals = await computeCartTotals(items, couponCode, SHIPPING_COST);
  res.json(buildResponse(items, couponCode, totals));
});

router.patch("/cart/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const productId = parseInt(req.params.productId as string, 10);
  const { quantity } = req.body;
  const cart = await getUserCart(userId);
  if (!cart) { res.status(404).json({ error: "Panier non trouvé" }); return; }
  let items: CartItem[] = (cart.items as CartItem[]) || [];
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx >= 0) {
    if (quantity <= 0) items.splice(idx, 1);
    else items[idx].quantity = quantity;
  }
  const couponCode = (cart.couponCode as string | null) || null;
  await db.update(cartTable).set({ items: items as any }).where(eq(cartTable.userId, userId));
  const totals = await computeCartTotals(items, couponCode, SHIPPING_COST);
  res.json(buildResponse(items, couponCode, totals));
});

router.delete("/cart/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const productId = parseInt(req.params.productId as string, 10);
  const cart = await getUserCart(userId);
  if (!cart) { res.status(404).json({ error: "Panier non trouvé" }); return; }
  let items: CartItem[] = (cart.items as CartItem[]) || [];
  items = items.filter((i) => i.productId !== productId);
  const couponCode = (cart.couponCode as string | null) || null;
  await db.update(cartTable).set({ items: items as any }).where(eq(cartTable.userId, userId));
  const totals = await computeCartTotals(items, couponCode, SHIPPING_COST);
  res.json(buildResponse(items, couponCode, totals));
});

router.post("/cart/coupon", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const { code } = req.body;
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code));
  if (!coupon || !coupon.isActive) { res.status(400).json({ error: "Code promo invalide" }); return; }
  const cart = await getUserCart(userId);
  if (!cart) { res.status(404).json({ error: "Panier vide" }); return; }
  const items: CartItem[] = (cart.items as CartItem[]) || [];
  await db.update(cartTable).set({ couponCode: code as any }).where(eq(cartTable.userId, userId));
  const totals = await computeCartTotals(items, code, SHIPPING_COST);
  res.json(buildResponse(items, code, totals));
});

export default router;
