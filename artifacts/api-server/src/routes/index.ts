import { Router, type IRouter } from "express";
import healthRouter from "./health";
import govassistRouter from "./govassist";

const router: IRouter = Router();

router.use(healthRouter);
router.use(govassistRouter);

export default router;
