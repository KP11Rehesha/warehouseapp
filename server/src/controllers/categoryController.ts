import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const categoryController = {
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
      });
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Error retrieving categories" });
    }
  },

  async getCategoryById(req: Request, res: Response) {
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
  },

  async createCategory(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      const category = await prisma.category.create({
        data: {
          categoryId: uuidv4(),
          name,
          description,
        },
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Error creating category' });
    }
  },

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      const category = await prisma.category.update({
        where: { categoryId: id },
        data: {
          name,
          description,
        },
      });

      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Error updating category' });
    }
  },

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if category has associated products
      const products = await prisma.products.findMany({
        where: { categoryId: id },
      });

      if (products.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete category with associated products. Please reassign or delete the products first.',
        });
      }

      await prisma.category.delete({
        where: { categoryId: id },
      });

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Error deleting category' });
    }
  },
};

export { categoryController }; 