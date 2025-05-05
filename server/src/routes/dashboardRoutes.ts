import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboardController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getDashboardMetrics);

export default router;
