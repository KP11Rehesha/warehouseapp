"use client";

import React from "react";
import Header from "@/app/(components)/Header";
import { useGetDashboardMetricsQuery, DashboardMetrics } from "@/state/api";
import DashboardKpiCard from "./DashboardKpiCard";
import StockMovementChart from "./StockMovementChart";
import ExpensesByCategoryChart from "./ExpensesByCategoryChart";
import {
  Package,
  AlertTriangle,
  DollarSign,
  Truck,
  Send,
  ClipboardList
} from 'lucide-react';

const DashboardPage = () => {
  const { data: dashboardData, isLoading, isError } = useGetDashboardMetricsQuery();

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="mx-auto pb-5 w-full">
      <Header name="Dashboard Overview" />
      <div className="mt-6">
        {isError && <p className="text-red-500">Error loading dashboard data.</p>}
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <DashboardKpiCard
            title="Total Active Products"
            value={dashboardData?.totalProducts ?? (isLoading ? '' : 'N/A')}
            icon={Package}
            bgColor="bg-sky-500"
            isLoading={isLoading}
          />
          <DashboardKpiCard
            title="Items Low on Stock"
            value={dashboardData?.lowStockItemsCount ?? (isLoading ? '' : 'N/A')}
            icon={AlertTriangle}
            bgColor="bg-orange-500"
            isLoading={isLoading}
            footerText={!isLoading && dashboardData?.lowStockItemsCount && dashboardData.lowStockItemsCount > 0 ? "Action may be required" : (!isLoading ? "All stock levels healthy" : "")}
          />
          <DashboardKpiCard
            title="Total Stock Value"
            value={isLoading ? '' : formatCurrency(dashboardData?.totalStockValue)}
            icon={DollarSign}
            bgColor="bg-green-500"
            isLoading={isLoading}
          />
          <DashboardKpiCard
            title="Receipts (Last 7d)"
            value={dashboardData?.recentGoodsReceiptsCount ?? (isLoading ? '' : 'N/A')}
            icon={Truck}
            bgColor="bg-purple-500"
            isLoading={isLoading}
          />
          <DashboardKpiCard
            title="Shipments (Last 7d)"
            value={dashboardData?.recentShipmentsCount ?? (isLoading ? '' : 'N/A')}
            icon={Send}
            bgColor="bg-teal-500"
            isLoading={isLoading}
          />
          <DashboardKpiCard
            title="Expenses (This Month)"
            value={isLoading ? '' : formatCurrency(dashboardData?.totalMonthlyExpenses)}
            icon={ClipboardList}
            bgColor="bg-red-500"
            isLoading={isLoading}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StockMovementChart 
            data={dashboardData?.stockMovement || []} 
            isLoading={isLoading} 
          />
          <ExpensesByCategoryChart 
            data={dashboardData?.monthlyExpensesByCategory || []} 
            isLoading={isLoading}
          />
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
