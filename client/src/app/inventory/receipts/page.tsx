'use client';

import React from 'react';
import Header from '@/app/(components)/Header';
import {
  useGetGoodsReceiptsQuery,
  GoodsReceipt,
} from '@/state/api';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';

// Basic Toast component (can be extracted to a shared component later)
const Toast = ({ message, onClose, type = 'success' }: { message: string, onClose: () => void, type?: 'success' | 'error' }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className={`fixed top-20 right-5 ${bgColor} text-white py-3 px-5 rounded-md shadow-lg z-[100] flex items-center justify-between`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-3 text-xl font-semibold">&times;</button>
    </div>
  );
};

export default function GoodsReceiptsListPage() {
  const router = useRouter();
  const { data: receiptsData, isLoading, isError, error } = useGetGoodsReceiptsQuery();
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const receipts = receiptsData || [];

  if (isLoading) return <div className="p-4">Loading goods receipts...</div>;
  if (isError) {
    console.error("Error fetching receipts:", error);
    return <div className="p-4 text-red-500">Error loading goods receipts. Please try again later.</div>;
  }
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Placeholder for future view details functionality
  const handleViewDetails = (receiptId: string) => {
    // This would navigate to a detailed view page, e.g., /inventory/receipts/[receiptId]
    // For now, we can just log or show a toast
    setToast({ message: `Viewing details for receipt ${receiptId} (not yet implemented).`, type: 'success' });
    // router.push(`/inventory/receipts/${receiptId}`); 
  };

  return (
    <div className="mx-auto pb-5 w-full">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Header name="Goods Receipts Log" />

      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        {receipts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No goods receipts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received At</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt: GoodsReceipt) => (
                  <tr key={receipt.receiptId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{receipt.receiptId.substring(0,8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.supplier || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(receipt.receivedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{receipt.items?.length || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={receipt.notes || ''}>{receipt.notes || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewDetails(receipt.receiptId)}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                        title="View Details (coming soon)"
                      >
                        <Eye size={18} className="mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 