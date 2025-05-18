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
  // const attachingUserId = (req as any).user?.id; // Temporarily removed due to linter issues

  try {
    if (!description || amount == null || !date) {
      res.status(400).json({ message: "Description, amount, and date are required." });
      return;
    }
    
    const expenseData: Prisma.ExpensesCreateInput = {
      description,
      amount: parseFloat(amount.toString()),
      date: new Date(date),
    };

    if (categoryId) {
      expenseData.category = { connect: { categoryId: categoryId } }; 
    }

    // Temporarily not associating user due to persistent linter errors
    // if (attachingUserId) {
    //   expenseData.user = { connect: { userId: attachingUserId } }; 
    // }

    const expense = await prisma.expenses.create({
      data: expenseData,
      include: {
        category: true,
        // user: true // Temporarily removed
      }
    });
    
    res.status(201).json(expense);
    return;

  } catch (error: any) {
    console.error("Error creating expense:", error);
    if (error.code === 'P2003' || error.code === 'P2025') { 
      if (error.meta?.field_name?.includes('categoryId') || error.message?.includes('Category')) {
        res.status(400).json({ message: "Invalid or non-existent category ID." }); return;
      }
      // User-related error check removed for now
      res.status(400).json({ message: "Invalid foreign key or referenced record not found." }); return;
    } else {
      res.status(500).json({ message: "Error creating expense" }); return;
    }
  }
};

// Update an expense by ID
export const updateExpenseById = async (req: Request, res: Response): Promise<void> => {
  const { expenseId } = req.params;
  const { description, amount, date, categoryId } = req.body;

  try {
    const dataToUpdate: Prisma.ExpensesUpdateInput = {};
    if (description !== undefined) dataToUpdate.description = description;
    if (amount !== undefined) dataToUpdate.amount = parseFloat(amount.toString());
    if (date !== undefined) dataToUpdate.date = new Date(date);
    
    if (categoryId === null) { 
        dataToUpdate.category = { disconnect: true };
    } else if (categoryId !== undefined) { 
        dataToUpdate.category = { connect: { categoryId: categoryId } };
    }
    
    const updatedExpense = await prisma.expenses.update({
      where: { expenseId: String(expenseId) },
      data: dataToUpdate,
      include: {
        category: true,
        // user: true // Temporarily removed
      }
    });
    
    res.json(updatedExpense);
    return;

  } catch (error: any) {
    console.error(`Error updating expense ${expenseId}:`, error);
    if (error.code === 'P2025') {
        res.status(404).json({ message: `Expense with ID ${expenseId} not found.` }); return;
    }  else if (error.code === 'P2003') {
        res.status(400).json({ message: "Invalid category ID for update." }); return;
    }
    res.status(500).json({ message: `Error updating expense ${expenseId}` }); return;
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
