import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { Expense } from '@/state/api'; // Import Expense type

interface ProcessedExpenseData {
  name: string; // Category name
  value: number; // Total amount for this category
}

interface ExpensesByCategoryChartProps {
  data: Expense[]; // Raw expense data for the month
  isLoading?: boolean;
}

// Predefined set of colors for pie chart segments
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', 
  '#00FFFF', '#800000', '#008000', '#000080', '#808000' 
];

const ExpensesByCategoryChart: React.FC<ExpensesByCategoryChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg shadow-md col-span-1 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-3/4 mb-6"></div>
        <div className="h-64 bg-gray-300 rounded"></div> 
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-lg shadow-md col-span-1">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Expenses by Category (Current Month)</h2>
        <p className="text-gray-600 text-center py-10">No expense data available for the current month.</p>
      </div>
    );
  }

  // Process data: sum expenses by category name
  const processedData: ProcessedExpenseData[] = data.reduce((acc, expense) => {
    const categoryName = expense.category?.name || 'Uncategorized';
    const existingCategory = acc.find(item => item.name === categoryName);
    if (existingCategory) {
      existingCategory.value += expense.amount;
    } else {
      acc.push({ name: categoryName, value: expense.amount });
    }
    return acc;
  }, [] as ProcessedExpenseData[]);
  
  if (processedData.length === 0) {
    return (
      <div className="bg-white p-5 rounded-lg shadow-md col-span-1">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Expenses by Category (Current Month)</h2>
        <p className="text-gray-600 text-center py-10">No categorized expense data to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow-md col-span-1">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Expenses by Category (Current Month)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            // label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpensesByCategoryChart; 