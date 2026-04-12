import { Router, type IRouter } from "express";
import healthRouter from "./health";
import respondentsRouter from "./respondents";
import sessionsRouter from "./sessions";
import iotRouter from "./iot";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/respondents", respondentsRouter);
router.use("/sessions", sessionsRouter);
router.use("/iot", iotRouter);

export default router;
