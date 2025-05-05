import { Router } from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { authMiddleware } from "../middleware/authMiddleware"; // Assuming you want to protect these routes

const router = Router();

// Public routes (adjust as needed)
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Protected routes (adjust as needed)
router.post("/", authMiddleware, createCategory);
router.put("/:id", authMiddleware, updateCategory);
router.delete("/:id", authMiddleware, deleteCategory);

export default router; 