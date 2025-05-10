import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Category {
  categoryId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  productId: string;
  sku: string | null;
  name: string;
  description?: string;
  price: number;
  dimensions?: string;
  weight?: number;
  imageUrl?: string;
  rating?: number;
  stockQuantity: number;
  categoryId?: string | null;
  category?: Category | null;
  productLocations?: ProductLocation[];
  minimumStockLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  productId?: string;
  name: string;
  sku?: string | null;
  description?: string;
  price: number;
  dimensions?: string;
  weight?: number;
  imageUrl?: string;
  rating?: number;
  stockQuantity: number;
  minimumStockLevel?: number;
  categoryId?: string | null;
}

export interface SalesSummary {
  salesSummaryId: string;
  totalValue: number;
  changePercentage?: number;
  date: string;
}

export interface PurchaseSummary {
  purchaseSummaryId: string;
  totalPurchased: number;
  changePercentage?: number;
  date: string;
}

export interface ExpenseSummary {
  expenseSummarId: string;
  totalExpenses: number;
  date: string;
}

export interface ExpenseByCategorySummary {
  expenseByCategorySummaryId: string;
  category: string;
  amount: string;
  date: string;
}

interface DailyActivity {
  date: string;
  receipts: number;
  shipments: number;
}

export interface DashboardMetrics {
  // New KPIs
  totalProducts: number;
  lowStockItemsCount: number;
  totalStockValue: number;
  recentGoodsReceiptsCount: number;
  recentShipmentsCount: number;
  totalMonthlyExpenses: number;
  // New Chart Data
  stockMovement: DailyActivity[];
  monthlyExpensesByCategory: Expense[]; // Array of full expense objects for the month

  // Decide if we keep these old ones or phase them out
  popularProducts?: Product[]; // Made optional for now
  salesSummary?: SalesSummary[]; // Made optional for now
  purchaseSummary?: PurchaseSummary[]; // Made optional for now
  // expenseSummary?: ExpenseSummary[]; // This seems replaced by totalMonthlyExpenses
  // expenseByCategorySummary?: ExpenseByCategorySummary[]; // This is covered by monthlyExpensesByCategory (raw data)
}

export interface User {
  userId: string;
  name: string;
  email: string;
}

export interface Expense {
  expenseId: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  categoryId?: string | null;
  category?: Category | null; // Optional: if you want to populate category details
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  expenseId?: string; // Optional for create, required for update
  description: string;
  amount: number;
  date: string; // ISO date string
  categoryId?: string | null;
}

export interface ExpenseFilterParams {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  minAmount?: string;
  maxAmount?: string;
}

export interface StorageBin {
  binId: string;
  name: string;
  locationDescription?: string;
  dimensions?: string;
  maxCapacityWeight?: number;
  maxCapacityUnits?: number;
  productLocations?: ProductLocation[];
  createdAt: string;
  updatedAt: string;
}

export interface StorageBinInput {
  binId?: string;
  name: string;
  locationDescription?: string;
  dimensions?: string;
  maxCapacityWeight?: number;
  maxCapacityUnits?: number;
}

export interface ProductLocation {
  productLocationId: string;
  productId: string;
  product?: Product; // Optional: if you want to populate product details
  binId: string;
  storageBin?: StorageBin; // Optional: if you want to populate bin details
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductLocationInput {
  productLocationId?: string;
  productId: string;
  binId: string;
  quantity: number;
}

// Interfaces for Goods Receipt (Check-in Workflow)
export interface GoodsReceiptItem {
  goodsReceiptItemId: string;
  goodsReceiptId: string;
  productId: string;
  product?: Product; // Optional, for population
  binId: string;
  storageBin?: StorageBin; // Optional, for population
  quantityReceived: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceipt {
  receiptId: string;
  supplier?: string | null;
  receivedAt: string;
  notes?: string | null;
  items: GoodsReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptItemInput {
  productId: string;
  binId: string;
  quantityReceived: number;
}

export interface GoodsReceiptInput {
  supplier?: string;
  receivedAt?: string; // Optional, defaults to now on backend
  notes?: string;
  items: GoodsReceiptItemInput[];
}

// Interfaces for Shipment (Check-out Workflow)
export interface ShipmentItem {
  shipmentItemId: string;
  shipmentId: string;
  productId: string;
  product?: Product;       // Optional, for population
  binId: string;
  storageBin?: StorageBin; // Optional, for population
  quantityShipped: number;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  shipmentId: string;
  customer?: string | null;
  shippedAt: string;
  notes?: string | null;
  items: ShipmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentItemInput {
  productId: string;
  binId: string; // From which bin the product is picked
  quantityShipped: number;
}

export interface ShipmentInput {
  customer?: string;
  notes?: string;
  items: ShipmentItemInput[];
  // shippedAt will be set by the server
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = createApi({
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`
      : 'http://localhost:3001/api', 
    credentials: 'include' 
  }),
  reducerPath: "api",
  tagTypes: ["DashboardMetrics", "Products", "Product", "Users", "Expenses", "Categories", "Category", "StorageBins", "StorageBin", "ProductLocations", "GoodsReceipts", "Shipments"],
  endpoints: (build) => ({
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "/dashboard",
      providesTags: ["DashboardMetrics"],
    }),
    getProducts: build.query<Product[], string | void>({
      query: (search) => ({
        url: "/products",
        params: search ? { search } : {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ productId }) => ({ type: 'Products' as const, id: productId })),
              { type: "Products", id: "LIST" },
            ]
          : [{ type: "Products", id: "LIST" }],
    }),
    getProductById: build.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    createProduct: build.mutation<Product, ProductInput>({
      query: (newProduct) => ({
        url: "/products",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),
    updateProduct: build.mutation<Product, ProductInput>({
      query: ({ productId, ...updateData }) => ({
        url: `/products/${productId}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Products", id: "LIST" },
        { type: "Product", id: productId },
      ],
    }),
    deleteProduct: build.mutation<void, string>({
      query: (productId) => ({
        url: `/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),
    getCategories: build.query<Category[], void>({
      query: () => "/categories",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ categoryId }) => ({ type: 'Categories' as const, id: categoryId })),
              { type: "Categories", id: "LIST" },
            ]
          : [{ type: "Categories", id: "LIST" }],
    }),
    getCategoryById: build.query<Category, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),
    createCategory: build.mutation<Category, Partial<Category>>({
      query: (newCategory) => ({
        url: "/categories",
        method: "POST",
        body: newCategory,
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),
    updateCategory: build.mutation<Category, Partial<Category> & { categoryId: string }>({
      query: ({ categoryId, ...updateData }) => ({
        url: `/categories/${categoryId}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { categoryId }) => [
        { type: "Categories", id: "LIST" },
        { type: "Category", id: categoryId },
      ],
    }),
    deleteCategory: build.mutation<void, string>({
      query: (categoryId) => ({
        url: `/categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),
    getUsers: build.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),
    getExpensesByCategory: build.query<ExpenseByCategorySummary[], void>({
      query: () => "/expenses/summary/by-category",
      providesTags: (result) =>
        result
          ? [
              { type: "Expenses", id: "CATEGORY_SUMMARY_LIST" }
            ]
          : [{ type: "Expenses", id: "CATEGORY_SUMMARY_LIST" }],
    }),
    getExpenses: build.query<Expense[], ExpenseFilterParams | void>({
      query: (params) => {
        if (!params) return "/expenses/all";
        
        // Build query string
        const queryParams = new URLSearchParams();
        
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.categoryId) queryParams.append('categoryId', params.categoryId);
        if (params.minAmount) queryParams.append('minAmount', params.minAmount);
        if (params.maxAmount) queryParams.append('maxAmount', params.maxAmount);
        
        const queryString = queryParams.toString();
        return `/expenses/all${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ expenseId }) => ({ type: 'Expenses' as const, id: expenseId })),
              { type: "Expenses", id: "LIST" },
            ]
          : [{ type: "Expenses", id: "LIST" }],
    }),
    createExpense: build.mutation<Expense, ExpenseInput>({
      query: (newExpense) => ({
        url: "/expenses",
        method: "POST",
        body: newExpense,
      }),
      invalidatesTags: [{ type: "Expenses", id: "LIST" }],
    }),
    updateExpense: build.mutation<Expense, ExpenseInput & { expenseId: string } >({
      query: ({ expenseId, ...updateData }) => ({
        url: `/expenses/${expenseId}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { expenseId }) => [
        { type: "Expenses", id: "LIST" },
        { type: 'Expenses' as const, id: expenseId }
      ],
    }),
    deleteExpense: build.mutation<void, string>({
      query: (expenseId) => ({
        url: `/expenses/${expenseId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Expenses", id: "LIST" }],
    }),
    getStorageBins: build.query<StorageBin[], void>({
      query: () => "/storage/bins",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ binId }) => ({ type: 'StorageBins' as const, id: binId })),
              { type: "StorageBins", id: "LIST" },
            ]
          : [{ type: "StorageBins", id: "LIST" }],
    }),
    getStorageBinById: build.query<StorageBin, string>({
      query: (binId) => `/storage/bins/${binId}`,
      providesTags: (result, error, binId) => [{ type: "StorageBin", id: binId }],
    }),
    createStorageBin: build.mutation<StorageBin, StorageBinInput>({
      query: (newBin) => ({
        url: "/storage/bins",
        method: "POST",
        body: newBin,
      }),
      invalidatesTags: [{ type: "StorageBins", id: "LIST" }],
    }),
    updateStorageBin: build.mutation<StorageBin, StorageBinInput & { binId: string }>({
      query: ({ binId, ...updateData }) => ({
        url: `/storage/bins/${binId}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { binId }) => [
        { type: "StorageBins", id: "LIST" },
        { type: "StorageBin", id: binId },
      ],
    }),
    deleteStorageBin: build.mutation<void, string>({
      query: (binId) => ({
        url: `/storage/bins/${binId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "StorageBins", id: "LIST" }],
    }),
    getProductLocations: build.query<ProductLocation[], { productId?: string; binId?: string }>({
      query: (params) => ({
        url: "/storage/product-locations",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ productLocationId }) => ({ type: 'ProductLocations' as const, id: productLocationId })),
              { type: "ProductLocations", id: "LIST" },
            ]
          : [{ type: "ProductLocations", id: "LIST" }],
    }),
    assignProductToBin: build.mutation<ProductLocation, { productId: string; binId: string; quantity: number }>({
      query: (assignment) => ({
        url: "/storage/product-locations",
        method: "POST",
        body: assignment,
      }),
      invalidatesTags: [{ type: "ProductLocations", id: "LIST" }, {type: "Products", id: "LIST"} /* Refresh product stock */],
    }),
    updateProductQuantityInBin: build.mutation<ProductLocation, { productLocationId: string; quantity: number }>({
      query: ({ productLocationId, quantity }) => ({
        url: `/storage/product-locations/${productLocationId}`,
        method: "PUT",
        body: { quantity },
      }),
      invalidatesTags: (result, error, { productLocationId }) => [
        { type: "ProductLocations", id: productLocationId }, 
        { type: "ProductLocations", id: "LIST" }, 
        {type: "Products", id: "LIST"} /* Refresh product stock */
      ],
    }),
    removeProductFromBin: build.mutation<void, string>({
      query: (productLocationId) => ({
        url: `/storage/product-locations/${productLocationId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ProductLocations", id: "LIST" }, {type: "Products", id: "LIST"} /* Refresh product stock */],
    }),
    // Goods Receipt Endpoints
    createGoodsReceipt: build.mutation<GoodsReceipt, GoodsReceiptInput>({
      query: (newGoodsReceipt) => ({
        url: "/storage/receipts", // Assuming receipts are under storage endpoint
        method: "POST",
        body: newGoodsReceipt,
      }),
      invalidatesTags: [
        { type: "GoodsReceipts", id: "LIST" }, 
        { type: "Products", id: "LIST" }, 
        { type: "ProductLocations", id: "LIST" }
      ],
    }),
    getGoodsReceipts: build.query<GoodsReceipt[], void>({
      query: () => "/storage/receipts",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ receiptId }) => ({ type: 'GoodsReceipts' as const, id: receiptId })),
              { type: "GoodsReceipts", id: "LIST" },
            ]
          : [{ type: "GoodsReceipts", id: "LIST" }],
    }),
    getGoodsReceiptById: build.query<GoodsReceipt, string>({
      query: (receiptId) => `/storage/receipts/${receiptId}`,
      providesTags: (result, error, receiptId) => [{ type: "GoodsReceipts", id: receiptId }],
    }),
    // Shipment (Check-out) Endpoints
    createShipment: build.mutation<Shipment, ShipmentInput>({
      query: (shipmentDetails) => ({
        url: "storage/shipments",
        method: "POST",
        body: shipmentDetails,
      }),
      invalidatesTags: ["Shipments", "ProductLocations", "Products"], // Invalidate related tags
    }),
    getShipments: build.query<Shipment[], void>({
      query: () => "storage/shipments",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ shipmentId }) => ({ type: "Shipments" as const, id: shipmentId })),
              { type: "Shipments", id: "LIST" },
            ]
          : [{ type: "Shipments", id: "LIST" }],
    }),
    getShipmentById: build.query<Shipment, string>({
      query: (shipmentId) => `storage/shipments/${shipmentId}`,
      providesTags: (result, error, shipmentId) => [{ type: "Shipments", id: shipmentId }],
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetUsersQuery,
  useGetExpensesByCategoryQuery,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetStorageBinsQuery,
  useGetStorageBinByIdQuery,
  useCreateStorageBinMutation,
  useUpdateStorageBinMutation,
  useDeleteStorageBinMutation,
  useGetProductLocationsQuery,
  useAssignProductToBinMutation,
  useUpdateProductQuantityInBinMutation,
  useRemoveProductFromBinMutation,
  useCreateGoodsReceiptMutation,
  useGetGoodsReceiptsQuery,
  useGetGoodsReceiptByIdQuery,
  useCreateShipmentMutation,
  useGetShipmentsQuery,
  useGetShipmentByIdQuery,
} = api;
