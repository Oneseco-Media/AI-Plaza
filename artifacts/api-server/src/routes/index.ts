import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appRouter from "./routes";
import aiTownRouter from "./ai-town";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiTownRouter);
router.use(appRouter);

export default router;
