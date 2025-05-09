'use client';

import RoleProtectedRoute from '@/components/RoleProtectedRoute';

export default function AdminPage() {
  return (
    <RoleProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p>This page is only visible to administrators.</p>
      </div>
    </RoleProtectedRoute>
  );
} 