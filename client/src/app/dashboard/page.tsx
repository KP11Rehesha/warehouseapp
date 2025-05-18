"use client";

import React from "react";
import Header from "@/app/(components)/Header";
import { useGetDashboardMetricsQuery, useGetStockValueByCategoryQuery } from "@/state/api";
import DashboardKpiCard from "./DashboardKpiCard";
import StockMovementChart from "./StockMovementChart";
import ExpensesByCategoryChart from "./ExpensesByCategoryChart";
import StockValueByCategoryChart from "./StockValueByCategoryChart";
import {
  Package,
  AlertTriangle,
  DollarSign,
  Truck,
  Send,
  ClipboardList
} from 'lucide-react';

const DashboardPage = () => {
  const { data: dashboardData, isLoading: isLoadingMetrics, isError: isErrorMetrics } = useGetDashboardMetricsQuery();
  const { data: stockValueByCategoryData, isLoading: isLoadingStockValue, isError: isErrorStockValue } = useGetStockValueByCategoryQuery();

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="mx-auto pb-5 w-full">
      <Header name="Dashboard Overview" />
      <div className="mt-6">
        {(isErrorMetrics || isErrorStockValue) && <p className="text-red-500">Error loading dashboard data.</p>}
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <DashboardKpiCard
            title="Total Active Products"
            value={dashboardData?.totalProducts ?? (isLoadingMetrics ? '' : 'N/A')}
            icon={Package}
            bgColor="bg-sky-500"
            isLoading={isLoadingMetrics}
          />
          <DashboardKpiCard
            title="Items Low on Stock"
            value={dashboardData?.lowStockItemsCount ?? (isLoadingMetrics ? '' : 'N/A')}
            icon={AlertTriangle}
            bgColor="bg-orange-500"
            isLoading={isLoadingMetrics}
            footerText={!isLoadingMetrics && dashboardData?.lowStockItemsCount && dashboardData.lowStockItemsCount > 0 ? "Action may be required" : (!isLoadingMetrics ? "All stock levels healthy" : "")}
          />
          <DashboardKpiCard
            title="Total Stock Value"
            value={isLoadingMetrics ? '' : formatCurrency(dashboardData?.totalStockValue)}
            icon={DollarSign}
            bgColor="bg-green-500"
            isLoading={isLoadingMetrics}
          />
          <DashboardKpiCard
            title="Receipts (Last 7d)"
            value={dashboardData?.recentGoodsReceiptsCount ?? (isLoadingMetrics ? '' : 'N/A')}
            icon={Truck}
            bgColor="bg-purple-500"
            isLoading={isLoadingMetrics}
          />
          <DashboardKpiCard
            title="Shipments (Last 7d)"
            value={dashboardData?.recentShipmentsCount ?? (isLoadingMetrics ? '' : 'N/A')}
            icon={Send}
            bgColor="bg-teal-500"
            isLoading={isLoadingMetrics}
          />
          <DashboardKpiCard
            title="Expenses (This Month)"
            value={isLoadingMetrics ? '' : formatCurrency(dashboardData?.totalMonthlyExpenses)}
            icon={ClipboardList}
            bgColor="bg-red-500"
            isLoading={isLoadingMetrics}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StockMovementChart 
            data={dashboardData?.stockMovement || []} 
            isLoading={isLoadingMetrics} 
          />
          <ExpensesByCategoryChart 
            data={dashboardData?.monthlyExpensesByCategory || []} 
            isLoading={isLoadingMetrics}
          />
          <StockValueByCategoryChart 
            data={stockValueByCategoryData || []} 
            isLoading={isLoadingStockValue}
          />
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
