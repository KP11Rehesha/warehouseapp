import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardKpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  bgColor?: string;
  iconColor?: string;
  footerText?: string;
  isLoading?: boolean;
}

const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
  title,
  value,
  icon: Icon,
  bgColor = 'bg-blue-500',
  iconColor = 'text-white',
  footerText,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-10 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-300 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </p>
        <div className={`p-2 rounded-full ${bgColor}`}>
          <Icon size={24} className={iconColor} />
        </div>
      </div>
      <p className="text-3xl font-semibold text-gray-800 mb-1">{value}</p>
      {footerText && (
        <p className="text-xs text-gray-400">{footerText}</p>
      )}
    </div>
  );
};

export default DashboardKpiCard; 