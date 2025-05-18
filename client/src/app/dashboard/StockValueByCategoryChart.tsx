import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { StockValueByCategory } from '@/state/api'; // Assuming this path is correct based on your setup

interface StockValueByCategoryChartProps {
  data: StockValueByCategory[];
  isLoading?: boolean;
}

// Updated color palette with more diverse, professional colors
const COLORS = [
  '#FFE165', // Bright yellow (first-color)
  '#DE4242', // Bright red (second-color)
  '#84243B', // Deep burgundy (third-color)
  '#412135', // Deep purple (fourth-color)
  '#4B9CD3', // Soft blue
  '#7CB342', // Muted green
  '#9575CD', // Soft purple
  '#FF8A65', // Soft coral
  '#78909C', // Blue grey
  '#4DB6AC', // Teal
  '#7986CB', // Indigo
  '#A1887F', // Brown
  '#90A4AE', // Blue grey
  '#81C784', // Green
  '#64B5F6', // Light blue
  '#BA68C8', // Purple
  '#4DD0E1', // Cyan
  '#FFB74D', // Orange
  '#E57373', // Red
  '#9FA8DA', // Lavender
  '#80DEEA', // Light cyan
  '#B39DDB', // Light purple
  '#80CBC4', // Mint
  '#AED581', // Light green
  '#FFCC80', // Peach
  '#EF9A9A', // Light red
  '#90CAF9', // Sky blue
  '#CE93D8', // Light magenta
  '#80D8FF'  // Ice blue
];

const StockValueByCategoryChart: React.FC<StockValueByCategoryChartProps> = ({ data, isLoading }) => {
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
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Stock Value by Category</h2>
        <p className="text-gray-600 text-center py-10">No stock value data available by category.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow-md col-span-1">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Stock Value by Category</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            // label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="totalStockValue"
            nameKey="categoryName"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}-${entry.categoryId}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockValueByCategoryChart; 