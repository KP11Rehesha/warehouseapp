'use client';

import { usePathname } from 'next/navigation';
import DashboardWrapper from './dashboardWrapper';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');

  return isAuthPage ? children : <DashboardWrapper>{children}</DashboardWrapper>;
} 