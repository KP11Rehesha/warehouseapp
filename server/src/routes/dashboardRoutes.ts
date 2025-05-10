import { Router } from "express";
import { getDashboardData } from "../controllers/dashboardController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getDashboardData);

export default router;
