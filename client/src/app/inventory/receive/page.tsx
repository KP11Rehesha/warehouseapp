'use client';

import React from 'react';
import Header from '@/app/(components)/Header';
import {
  useCreateGoodsReceiptMutation,
  useGetProductsQuery,
  useGetStorageBinsQuery,
  Product,
  StorageBin,
  GoodsReceiptInput,
  GoodsReceiptItemInput,
} from '@/state/api';
import { PlusCircleIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

type ReceiptItemForm = Omit<GoodsReceiptItemInput, 'quantityReceived'> & {
  id: string; // for local list management
  quantityReceived: string | number; // Allow string for input, parse to number on submit
};

export default function ReceiveStockPage() {
  const router = useRouter();
  const [supplier, setSupplier] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [items, setItems] = React.useState<ReceiptItemForm[]>([]);
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: products, isLoading: isLoadingProducts, error: errorProducts } = useGetProductsQuery();
  const { data: storageBins, isLoading: isLoadingBins, error: errorBins } = useGetStorageBinsQuery();
  const [createGoodsReceipt, { isLoading: isCreatingReceipt }] = useCreateGoodsReceiptMutation();

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), productId: '', binId: '', quantityReceived: '' }]);
  };

  const handleItemChange = (index: number, field: keyof ReceiptItemForm, value: string) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setToast(null);

    if (items.length === 0) {
      setToast({ message: 'Please add at least one item to the receipt.', type: 'error' });
      return;
    }

    const processedItems: GoodsReceiptItemInput[] = [];
    for (const item of items) {
      if (!item.productId || !item.binId || !item.quantityReceived) {
        setToast({ message: 'All fields for each item are required (Product, Bin, Quantity).', type: 'error' });
        return;
      }
      const quantity = parseInt(String(item.quantityReceived), 10);
      if (isNaN(quantity) || quantity <= 0) {
        setToast({ message: 'Quantity received must be a positive number for all items.', type: 'error' });
        return;
      }
      processedItems.push({
        productId: item.productId,
        binId: item.binId,
        quantityReceived: quantity,
      });
    }
    
    const receiptData: GoodsReceiptInput = {
      supplier: supplier || undefined,
      notes: notes || undefined,
      items: processedItems,
    };

    try {
      await createGoodsReceipt(receiptData).unwrap();
      setToast({ message: 'Goods receipt created successfully!', type: 'success' });
      // Optionally redirect or clear form
      setSupplier('');
      setNotes('');
      setItems([]);
      setTimeout(() => router.push('/inventory/receipts'), 2000); // Redirect after showing success
    } catch (err: any) {
      console.error('Failed to create goods receipt:', err);
      setToast({ message: err?.data?.message || 'Failed to create goods receipt.', type: 'error' });
    }
  };

  const labelCssStyles = "block text-sm font-medium text-gray-700 mb-1";
  const inputCssStyles = "block w-full mb-3 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const selectCssStyles = inputCssStyles;
  const buttonCssStyles = "px-4 py-2 rounded-md text-white disabled:opacity-50";
  
  if (isLoadingProducts || isLoadingBins) return <div className="p-4">Loading products and bins...</div>;
  if (errorProducts || errorBins) return <div className="p-4 text-red-500">Error loading data. Please try again.</div>;


  return (
    <div className="mx-auto pb-5 w-full">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Header name="Receive New Stock / Goods Receipt" />

      <form onSubmit={handleSubmit} className="mt-6 bg-white p-6 rounded-lg shadow space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="supplier" className={labelCssStyles}>Supplier (Optional)</label>
            <input
              type="text"
              name="supplier"
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className={inputCssStyles}
              placeholder="e.g., Global Goods Inc."
            />
          </div>
          <div>
            <label htmlFor="notes" className={labelCssStyles}>Notes (Optional)</label>
            <textarea
              name="notes"
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputCssStyles}
              placeholder="e.g., Order #123, backordered items, etc."
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className={`${buttonCssStyles} bg-green-500 hover:bg-green-600 flex items-center`}
              disabled={isCreatingReceipt}
            >
              <PlusCircleIcon size={20} className="mr-2" /> Add Item
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No items added yet. Click "Add Item" to begin.</p>
          )}

          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end p-3 mb-3 border rounded-md relative">
              <div className="md:col-span-3">
                <label htmlFor={`product-${index}`} className={labelCssStyles}>Product *</label>
                <select
                  id={`product-${index}`}
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  className={selectCssStyles}
                  required
                >
                  <option value="">-- Select Product --</option>
                  {products?.map((p: Product) => (
                    <option key={p.productId} value={p.productId}>{p.name} (SKU: {p.sku || 'N/A'})</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor={`bin-${index}`} className={labelCssStyles}>Storage Bin *</label>
                <select
                  id={`bin-${index}`}
                  value={item.binId}
                  onChange={(e) => handleItemChange(index, 'binId', e.target.value)}
                  className={selectCssStyles}
                  required
                >
                  <option value="">-- Select Bin --</option>
                  {storageBins?.map((b: StorageBin) => (
                    <option key={b.binId} value={b.binId}>{b.name} {b.locationDescription ? `(${b.locationDescription})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor={`quantity-${index}`} className={labelCssStyles}>Quantity Received *</label>
                <input
                  type="number"
                  id={`quantity-${index}`}
                  value={item.quantityReceived}
                  onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)}
                  className={inputCssStyles}
                  placeholder="e.g., 10"
                  min="1"
                  required
                />
              </div>
              <div className="md:col-span-1 flex items-center justify-end">
                 <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className={`${buttonCssStyles} bg-red-500 hover:bg-red-600 p-2`}
                  disabled={isCreatingReceipt}
                  title="Remove Item"
                >
                  <Trash2Icon size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            className={`${buttonCssStyles} bg-blue-600 hover:bg-blue-700`}
            disabled={isCreatingReceipt || items.length === 0}
          >
            {isCreatingReceipt ? 'Saving Receipt...' : 'Save Goods Receipt'}
          </button>
        </div>
      </form>
    </div>
  );
} 