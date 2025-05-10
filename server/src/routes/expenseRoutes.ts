import { Router } from "express";
import {
  getExpenseSummaryByCategory,
  getAllExpenses,
  createExpense,
  updateExpenseById,
  deleteExpenseById
} from "../controllers/expenseController";
import { authMiddleware } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";
import { Role } from "@prisma/client";

const router = Router();

// Route for expense summary by category
router.get("/summary/by-category", 
  authMiddleware,
  getExpenseSummaryByCategory
);

// Test route to verify functionality
router.get("/test", (req, res) => {
  res.json({ message: "Expenses API is working!" });
});

// Get all expenses
router.get("/all", authMiddleware, getAllExpenses);

router.post("/", 
  authMiddleware, 
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]),
  createExpense
);

router.put("/:expenseId", 
  authMiddleware, 
  roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]),
  updateExpenseById
);

router.delete("/:expenseId", 
  authMiddleware, 
  roleMiddleware([Role.ADMIN]),
  deleteExpenseById
);

export default router;
