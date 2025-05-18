import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DailyActivity {
  date: string;
  receipts: number; // Count of items received
  shipments: number; // Count of items shipped
}

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Total Active Products
    const totalProducts = await prisma.products.count();

    // 2. Items Low on Stock
    const lowStockItemsCount = await prisma.products.count({
      where: {
        stockQuantity: { lte: prisma.products.fields.minimumStockLevel },
        minimumStockLevel: { not: null }, // Only consider products where a minimum is set
      },
    });

    // 3. Total Stock Value
    const productsForValue = await prisma.products.findMany({
      select: { price: true, stockQuantity: true },
    });
    const totalStockValue = productsForValue.reduce((sum, p) => sum + p.price * p.stockQuantity, 0);

    // 4. Goods Receipts (Last 7 Days)
    const recentGoodsReceiptsCount = await prisma.goodsReceipt.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // 5. Shipments (Last 7 Days)
    const recentShipmentsCount = await prisma.shipment.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // 6. Expenses (Current Month)
    const monthlyExpensesResult = await prisma.expenses.aggregate({
      _sum: { amount: true },
      where: { date: { gte: startOfMonth } },
    });
    const totalMonthlyExpenses = monthlyExpensesResult._sum.amount || 0;

    // 7. Stock Movement (Last 30 Days)
    const dailyReceiptItems = await prisma.goodsReceiptItem.groupBy({
      by: ['createdAt'],
      _sum: { quantityReceived: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'asc' },
    });

    const dailyShippedItems = await prisma.shipmentItem.groupBy({
      by: ['createdAt'],
      _sum: { quantityShipped: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'asc' },
    });
    
    // Combine and format daily activity data
    const stockMovement: DailyActivity[] = [];
    const activityMap = new Map<string, { receipts: number; shipments: number }>();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      activityMap.set(dateString, { receipts: 0, shipments: 0 });
    }

    dailyReceiptItems.forEach(item => {
      const dateString = item.createdAt.toISOString().split('T')[0];
      if (activityMap.has(dateString)) {
        activityMap.get(dateString)!.receipts = item._sum.quantityReceived || 0;
      }
    });

    dailyShippedItems.forEach(item => {
      const dateString = item.createdAt.toISOString().split('T')[0];
      if (activityMap.has(dateString)) {
        activityMap.get(dateString)!.shipments = item._sum.quantityShipped || 0;
      }
    });
    
    activityMap.forEach((value, key) => {
        stockMovement.push({ date: key, ...value });
    });
    stockMovement.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending

    // 8. Expenses by Category (Current Month) - Assuming you have a way to get this or will add it
    // For now, let's fetch raw expenses for the month and it can be processed client-side or with another helper
    const monthlyExpensesByCategory = await prisma.expenses.findMany({
        where: { date: { gte: startOfMonth } },
        include: { category: true }, // if you want to group by category name
    });

    // Remove or adapt existing dashboard metrics as needed
    // const popularProducts = await getPopularProducts(prisma);
    // const salesSummary = await getSalesSummary(prisma);
    // const purchaseSummary = await getPurchaseSummary(prisma);
    // const expenseSummary = await getExpenseSummary(prisma);
    // const expenseByCategorySummary = await getExpenseByCategorySummary(prisma);

    res.json({
      totalProducts,
      lowStockItemsCount,
      totalStockValue,
      recentGoodsReceiptsCount,
      recentShipmentsCount,
      totalMonthlyExpenses,
      stockMovement, // Daily items received vs shipped
      monthlyExpensesByCategory, // Raw data for pie chart
      // popularProducts, // Keep or remove
      // salesSummary, // Keep, remove or adapt
      // purchaseSummary, // Keep, remove or adapt
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
};

// New function to get total stock value by category
export const getStockValueByCategory = async (req: Request, res: Response) => {
  try {
    const categoriesWithStockValue = await prisma.category.findMany({
      select: {
        categoryId: true, // Assuming categoryId is the actual ID field from Prisma client type
        name: true,
        products: {
          select: {
            price: true,
            stockQuantity: true,
          },
        },
      },
    });

    const result = categoriesWithStockValue.map(category => {
      const totalValue = category.products.reduce((sum, product) => {
        // Ensure price and stockQuantity are treated as numbers, defaulting to 0 if null/undefined
        const price = Number(product.price) || 0;
        const stockQuantity = Number(product.stockQuantity) || 0;
        return sum + price * stockQuantity;
      }, 0);
      return {
        categoryId: category.categoryId,
        categoryName: category.name,
        totalStockValue: totalValue,
      };
    });

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching stock value by category:", error);
    res.status(500).json({ message: "Error fetching stock value by category", details: error.message });
  }
};

// Keep or remove/adapt other helper functions like getPopularProducts, etc.
// For example, if getPopularProducts is still needed:
/*
async function getPopularProducts(prisma: PrismaClient) {
  // Your existing logic for popular products
  return []; // Placeholder
}
*/
