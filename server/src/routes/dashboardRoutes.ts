import { Router } from "express";
import { getDashboardData, getStockValueByCategory } from "../controllers/dashboardController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getDashboardData);

// New route for stock value by category
router.get("/stock-value-by-category", authMiddleware, getStockValueByCategory);

export default router;
