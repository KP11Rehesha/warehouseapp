'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/services/authService';

type Role = 'ADMIN' | 'WAREHOUSE_STAFF';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export default function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.checkAuth();
        console.log('User role:', user.role); // Debug log
        const hasRequiredRole = allowedRoles.includes(user.role as Role);
        console.log('Has required role:', hasRequiredRole); // Debug log
        
        if (!hasRequiredRole) {
          router.push('/unauthorized');
        }
        
        setIsAuthorized(hasRequiredRole);
      } catch (error) {
        console.error('Auth check error:', error); // Debug log
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [allowedRoles, router]);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? <>{children}</> : null;
} 