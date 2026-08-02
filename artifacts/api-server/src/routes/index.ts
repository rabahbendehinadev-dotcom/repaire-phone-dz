import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import brandsRouter from "./brands";
import productsRouter from "./products";
import reviewsRouter from "./reviews";
import cartRouter from "./cart";
import wishlistRouter from "./wishlist";
import ordersRouter from "./orders";
import couponsRouter from "./coupons";
import bannersRouter from "./banners";
import settingsRouter from "./settings";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(brandsRouter);
router.use(productsRouter);
router.use(reviewsRouter);
router.use(cartRouter);
router.use(wishlistRouter);
router.use(ordersRouter);
router.use(couponsRouter);
router.use(bannersRouter);
router.use(settingsRouter);
router.use(adminRouter);

export default router;
