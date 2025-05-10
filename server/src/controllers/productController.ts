import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const getProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Fetching products...");
    const search = req.query.search?.toString();
    const products = await prisma.products.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        category: true,
      },
    });
    console.log(`Products found: ${products.length}`);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error retrieving products" });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.products.findUnique({
      where: { productId: id },
      include: {
        category: true,
      },
    });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error retrieving product" });
  }
};

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      sku,
      description,
      price,
      stockQuantity,
      categoryId,
      dimensions,
      weight,
      imageUrl,
      rating,
      minimumStockLevel,
    } = req.body;

    if (!name || price === undefined) {
      res
        .status(400)
        .json({ message: "Name and price are required fields." });
      return;
    }

    let finalSku = sku;
    if (!sku) {
      finalSku = uuidv4();
      console.log(`SKU not provided for product '${name}', generated: ${finalSku}`);
    } else {
      const existingSku = await prisma.products.findUnique({ where: { sku } });
      if (existingSku) {
        res.status(400).json({ message: `SKU '${sku}' already exists.` });
        return;
      }
    }

    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { categoryId } });
      if (!categoryExists) {
        res.status(400).json({ message: `Category with ID '${categoryId}' not found.` });
        return;
      }
    }

    const product = await prisma.products.create({
      data: {
        name,
        sku: finalSku,
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        categoryId,
        dimensions,
        weight: weight ? parseFloat(weight) : undefined,
        imageUrl,
        rating: rating ? parseFloat(rating) : undefined,
        minimumStockLevel: minimumStockLevel ? parseInt(minimumStockLevel, 10) : undefined,
      },
      include: { category: true, productLocations: { include: { storageBin: true } } },
    });
    res.status(201).json(product);

  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
      res.status(400).json({ message: `SKU '${req.body.sku}' already exists.` });
    } else {
      res.status(500).json({ message: "Error creating product" });
    }
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      price,
      categoryId,
      dimensions,
      weight,
      imageUrl,
      rating,
      minimumStockLevel,
    } = req.body;

    if (sku) {
      const existingSku = await prisma.products.findUnique({ where: { sku } });
      if (existingSku && existingSku.productId !== id) {
        res.status(400).json({ message: `SKU '${sku}' is already used by another product.` });
        return;
      }
    }
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { categoryId } });
      if (!categoryExists) {
        res.status(400).json({ message: `Category with ID '${categoryId}' not found.` });
        return;
      }
    }

    const product = await prisma.products.findUnique({ where: { productId: id } });
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const updatedProduct = await prisma.products.update({
      where: { productId: id },
      data: {
        name: name !== undefined ? name : product.name,
        sku: sku !== undefined ? sku : product.sku,
        description: description !== undefined ? description : product.description,
        price: price !== undefined ? parseFloat(price) : product.price,
        categoryId: categoryId !== undefined ? categoryId : product.categoryId,
        dimensions: dimensions !== undefined ? dimensions : product.dimensions,
        weight: weight !== undefined ? (weight === null ? null : parseFloat(weight)) : product.weight,
        imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl,
        rating: rating !== undefined ? (rating === null ? null : parseFloat(rating)) : product.rating,
        minimumStockLevel: minimumStockLevel !== undefined ? (minimumStockLevel === null ? null : parseInt(minimumStockLevel, 10)) : product.minimumStockLevel,
        updatedAt: new Date(),
      },
      include: { category: true, productLocations: { include: { storageBin: true } } },
    });

    res.json(updatedProduct);

  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: "Product not found" });
    } else if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
      res.status(400).json({ message: `SKU '${req.body.sku}' already exists.` });
    } else {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Error updating product" });
    }
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.products.delete({
      where: { productId: id },
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: "Product not found" });
    } else {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Error deleting product" });
    }
  }
};
