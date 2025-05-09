import { Router } from "express";
import { categoryController } from "../controllers/categoryController";
import { authMiddleware } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";
import { Role } from "@prisma/client";

const router = Router();

// All category routes require authentication
router.use(authMiddleware);

// Get all categories - accessible by all authenticated users
router.get("/", categoryController.getCategories);

// Create, update, and delete operations require ADMIN role
router.post("/", roleMiddleware([Role.ADMIN]), categoryController.createCategory);
router.put("/:id", roleMiddleware([Role.ADMIN]), categoryController.updateCategory);
router.delete("/:id", roleMiddleware([Role.ADMIN]), categoryController.deleteCategory);

export default router; 