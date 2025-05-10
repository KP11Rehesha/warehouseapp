import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface StockMovementDataPoint {
  date: string;
  receipts: number;
  shipments: number;
}

interface StockMovementChartProps {
  data: StockMovementDataPoint[];
  isLoading?: boolean;
}

const StockMovementChart: React.FC<StockMovementChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg shadow-md col-span-1 md:col-span-2 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-3/4 mb-6"></div>
        <div className="h-64 bg-gray-300 rounded"></div>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-lg shadow-md col-span-1 md:col-span-2">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Stock Movement (Last 30 Days)</h2>
        <p className="text-gray-600 text-center py-10">No stock movement data available for the last 30 days.</p>
      </div>
    );
  }

  // Format date for XAxis
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="bg-white p-5 rounded-lg shadow-md col-span-1 md:col-span-2">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Stock Movement (Last 30 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="date" stroke="#666" />
          <YAxis allowDecimals={false} stroke="#666" />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
            itemStyle={{ color: '#333' }}
            labelStyle={{ color: '#000', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
          <Line type="monotone" dataKey="receipts" name="Items Received" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="shipments" name="Items Shipped" stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockMovementChart; 