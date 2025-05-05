import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error retrieving categories" });
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { categoryId: id },
      include: { products: true }, // Optionally include related products
    });
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Error retrieving category" });
  }
};

// Create a new category
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: "Category name is required" });
      return;
    }
    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creating category" });
  }
};

// Update a category
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: "Category name is required" });
      return;
    }
    const category = await prisma.category.update({
      where: { categoryId: id },
      data: {
        name,
        description,
      },
    });
    res.json(category);
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma error code for record not found
      res.status(404).json({ message: "Category not found" });
    } else {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Error updating category" });
    }
  }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Optional: Check if category has associated products before deleting
    // const products = await prisma.products.count({ where: { categoryId: id } });
    // if (products > 0) {
    //   return res.status(400).json({ message: 'Cannot delete category with associated products' });
    // }
    await prisma.category.delete({
      where: { categoryId: id },
    });
    res.status(204).send(); // No content
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: "Category not found" });
    } else {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Error deleting category" });
    }
  }
}; 