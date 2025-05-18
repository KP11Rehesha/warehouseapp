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
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      const category = await prisma.category.create({
        data: {
          name,
        },
      });

      res.status(201).json(category);
    } catch (error: any) {
      console.error('Error creating category:', error);
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        return res.status(409).json({ message: `A category with the name '${req.body.name}' already exists.` });
      }
      res.status(500).json({ message: 'Error creating category' });
    }
  },

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      const category = await prisma.category.update({
        where: { categoryId: id },
        data: {
          name,
        },
      });

      res.json(category);
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Category not found' });
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        return res.status(409).json({ message: `A category with the name '${req.body.name}' already exists.` });
      }
      res.status(500).json({ message: 'Error updating category' });
    }
  },

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

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
    } catch (error: any) {
      console.error('Error deleting category:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.status(500).json({ message: 'Error deleting category' });
    }
  },
};

export { categoryController }; 