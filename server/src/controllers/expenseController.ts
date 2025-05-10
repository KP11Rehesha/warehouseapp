import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Get expense summary by category
export const getExpenseSummaryByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const expenseByCategorySummaryRaw = await prisma.expenseByCategory.findMany({
      orderBy: {
        date: "desc",
      },
    });
    
    const expenseByCategorySummary = expenseByCategorySummaryRaw.map((item) => ({
      ...item,
      amount: item.amount.toString(),
    }));

    res.json(expenseByCategorySummary);
  } catch (error) {
    console.error("Error fetching expense summary by category:", error);
    res.status(500).json({ message: "Error retrieving expense summary by category" });
  }
};

// Get all expenses
export const getAllExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      startDate, 
      endDate, 
      categoryId, 
      minAmount, 
      maxAmount 
    } = req.query;
    
    // @ts-ignore - We know these fields exist in the Prisma schema
    const where: Prisma.ExpensesWhereInput = {};
    
    // Date filters - only apply if explicitly provided
    if (startDate || endDate) {
      // @ts-ignore - We know these fields exist in the Prisma schema
      where.date = {};
      
      if (startDate) {
        // @ts-ignore - We know these fields exist in the Prisma schema
        where.date.gte = new Date(startDate as string);
      }
      
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999); // End of day
        // @ts-ignore - We know these fields exist in the Prisma schema
        where.date.lte = end;
      }
    }
    
    // Category filter
    if (categoryId) {
      // @ts-ignore - We know these fields exist in the Prisma schema
      where.categoryId = categoryId as string;
    }
    
    // Amount filters
    if (minAmount || maxAmount) {
      // @ts-ignore - We know these fields exist in the Prisma schema
      where.amount = {};
      
      if (minAmount) {
        // @ts-ignore - We know these fields exist in the Prisma schema
        where.amount.gte = parseFloat(minAmount as string);
      }
      
      if (maxAmount) {
        // @ts-ignore - We know these fields exist in the Prisma schema
        where.amount.lte = parseFloat(maxAmount as string);
      }
    }
    
    const expenses = await prisma.expenses.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        // @ts-ignore - We know these fields exist in the Prisma schema
        createdAt: 'desc', // Order by creation date instead of expense date
      }
    });
    
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Error retrieving expenses" });
  }
};

// Create a new expense
export const createExpense = async (req: Request, res: Response): Promise<void> => {
  const { description, amount, date, categoryId } = req.body;
  try {
    if (!description || amount == null || !date) {
      res.status(400).json({ message: "Description, amount, and date are required." });
      return;
    }
    
    // @ts-ignore - We know these fields exist in the Prisma schema
    const expense = await prisma.expenses.create({
      data: {
        description,
        amount: parseFloat(amount.toString()),
        date: new Date(date),
        categoryId: categoryId || null,
      },
      include: {
        category: true,
      }
    });
    
    res.status(201).json(expense);
  } catch (error) {
    console.error("Error creating expense:", error);
    if (error instanceof Error && error.message.includes("foreign key constraint fails")) {
      res.status(400).json({ message: "Invalid category ID." });
    } else {
      res.status(500).json({ message: "Error creating expense" });
    }
  }
};

// Update an expense by ID
export const updateExpenseById = async (req: Request, res: Response): Promise<void> => {
  const { expenseId } = req.params;
  const { description, amount, date, categoryId } = req.body;
  
  try {
    // @ts-ignore - We know these fields exist in the Prisma schema
    const updatedExpense = await prisma.expenses.update({
      where: { 
        expenseId: String(expenseId)
      },
      data: {
        description: description || undefined,
        amount: amount !== undefined ? parseFloat(amount.toString()) : undefined,
        date: date ? new Date(date) : undefined,
        categoryId: categoryId || null,
      },
      include: {
        category: true,
      }
    });
    
    res.json(updatedExpense);
  } catch (error) {
    console.error(`Error updating expense ${expenseId}:`, error);
    res.status(500).json({ message: `Error updating expense ${expenseId}` });
  }
};

// Delete an expense by ID
export const deleteExpenseById = async (req: Request, res: Response): Promise<void> => {
  const { expenseId } = req.params;
  
  try {
    await prisma.expenses.delete({
      where: { 
        expenseId: String(expenseId)
      },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting expense ${expenseId}:`, error);
    res.status(500).json({ message: `Error deleting expense ${expenseId}` });
  }
};
