import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appRouter from "./routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(appRouter);

export default router;
