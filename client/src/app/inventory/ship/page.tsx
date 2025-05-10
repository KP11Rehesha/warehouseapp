'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/app/(components)/Header';
import {
  useCreateShipmentMutation,
  useGetProductsQuery,
  useGetStorageBinsQuery, // We might need a more specific query for bins with stock for a product
  useGetProductLocationsQuery, // To check stock in specific bins
  Product,
  StorageBin,
  ProductLocation,
  ShipmentInput,
  ShipmentItemInput,
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

type ShipmentItemForm = Omit<ShipmentItemInput, 'quantityShipped'> & {
  id: string; // for local list management
  quantityShipped: string | number; // Allow string for input, parse to number on submit
  availableInBin?: number; // To display available quantity in the selected bin
};

export default function CreateShipmentPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ShipmentItemForm[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: productsData, isLoading: isLoadingProducts } = useGetProductsQuery();
  // For bin selection, we need to be more dynamic based on the selected product.
  // We'll fetch all product locations initially, then filter or make specific queries as needed.
  const { data: productLocationsData, isLoading: isLoadingProductLocations } = useGetProductLocationsQuery({});
  
  const [createShipment, { isLoading: isCreatingShipment }] = useCreateShipmentMutation();

  const products = productsData || [];
  const allProductLocations = productLocationsData || [];

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), productId: '', binId: '', quantityShipped: '', availableInBin: 0 }]);
  };

  const handleItemChange = (
    index: number, 
    field: keyof ShipmentItemForm, 
    value: string
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // If productId changes, reset binId and availableInBin
    if (field === 'productId') {
      updatedItems[index].binId = '';
      updatedItems[index].availableInBin = 0;
    }

    // If binId changes for a selected product, update availableInBin
    if (field === 'binId' && updatedItems[index].productId && value) {
      const selectedLocation = allProductLocations.find(
        (loc) => loc.productId === updatedItems[index].productId && loc.binId === value
      );
      updatedItems[index].availableInBin = selectedLocation?.quantity || 0;
    }
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setToast(null);

    if (items.length === 0) {
      setToast({ message: 'Please add at least one item to the shipment.', type: 'error' });
      return;
    }

    const processedItems: ShipmentItemInput[] = [];
    for (const item of items) {
      if (!item.productId || !item.binId || !item.quantityShipped) {
        setToast({ message: 'Product, Bin, and Quantity are required for all shipment items.', type: 'error' });
        return;
      }
      const quantity = parseInt(String(item.quantityShipped), 10);
      if (isNaN(quantity) || quantity <= 0) {
        setToast({ message: 'Quantity shipped must be a positive number.', type: 'error' });
        return;
      }
      if (item.availableInBin === undefined || quantity > item.availableInBin) {
        const product = products.find(p => p.productId === item.productId);
        const bin = allProductLocations.find(pl => pl.binId === item.binId)?.storageBin;
        setToast({ 
            message: `Insufficient stock for ${product?.name || 'product'} in bin ${bin?.name || 'selected bin'}. Available: ${item.availableInBin || 0}, Requested: ${quantity}`,
            type: 'error' 
        });
        return;
      }
      processedItems.push({
        productId: item.productId,
        binId: item.binId,
        quantityShipped: quantity,
      });
    }

    const shipmentData: ShipmentInput = {
      customer: customer || undefined,
      notes: notes || undefined,
      items: processedItems,
    };

    try {
      await createShipment(shipmentData).unwrap();
      setToast({ message: 'Shipment created successfully!', type: 'success' });
      setCustomer('');
      setNotes('');
      setItems([]);
      // router.push('/inventory/shipments'); // Optional: Redirect to shipments list page after creation
    } catch (err: any) {
      console.error('Failed to create shipment:', err);
      setToast({ message: err?.data?.message || 'Failed to create shipment.', type: 'error' });
    }
  };

  const getBinsForProduct = (productId: string): (StorageBin & { quantity: number })[] => {
    if (!productId) return [];
    return allProductLocations
      .filter(loc => loc.productId === productId && loc.quantity > 0 && loc.storageBin)
      .map(loc => ({ ...loc.storageBin!, quantity: loc.quantity }));
  };

  const labelCssStyles = "block text-sm font-medium text-gray-700 mb-1";
  const inputCssStyles = "block w-full mb-3 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const selectCssStyles = inputCssStyles;
  const buttonCssStyles = "px-4 py-2 rounded-md text-white disabled:opacity-50";

  if (isLoadingProducts || isLoadingProductLocations) return <div className="p-4">Loading initial data...</div>;

  return (
    <div className="mx-auto pb-5 w-full">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Header name="Create New Shipment" />

      <form onSubmit={handleSubmit} className="mt-6 bg-white p-6 rounded-lg shadow space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="customer" className={labelCssStyles}>Customer (Optional)</label>
            <input
              type="text"
              name="customer"
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className={inputCssStyles}
              placeholder="e.g., John Doe, Company XYZ"
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
              placeholder="e.g., Order #456, special instructions"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Shipment Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className={`${buttonCssStyles} bg-green-500 hover:bg-green-600 flex items-center`}
              disabled={isCreatingShipment}
            >
              <PlusCircleIcon size={20} className="mr-2" /> Add Item
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No items added. Click "Add Item" to start.</p>
          )}

          {items.map((item, index) => {
            const availableBinsForProduct = getBinsForProduct(item.productId);
            return (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-10 gap-3 items-end p-3 mb-3 border rounded-md relative">
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
                    {products.map((p: Product) => (
                      <option key={p.productId} value={p.productId}>{p.name} (SKU: {p.sku || 'N/A'})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label htmlFor={`bin-${index}`} className={labelCssStyles}>Pick From Bin *</label>
                  <select
                    id={`bin-${index}`}
                    value={item.binId}
                    onChange={(e) => handleItemChange(index, 'binId', e.target.value)}
                    className={selectCssStyles}
                    required
                    disabled={!item.productId} // Disable if no product selected
                  >
                    <option value="">-- Select Bin --</option>
                    {item.productId ? (
                        availableBinsForProduct.length > 0 ? (
                            availableBinsForProduct.map((b) => (
                                <option key={b.binId} value={b.binId}>
                                    {b.name} (Available: {b.quantity})
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>No bins with stock for this product</option>
                        )
                    ) : (
                        <option value="" disabled>Select a product first</option>
                    )}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor={`quantity-${index}`} className={labelCssStyles}>Quantity to Ship *</label>
                  <input
                    type="number"
                    id={`quantity-${index}`}
                    value={item.quantityShipped}
                    onChange={(e) => handleItemChange(index, 'quantityShipped', e.target.value)}
                    className={inputCssStyles}
                    placeholder="e.g., 5"
                    min="1"
                    max={item.availableInBin || undefined} // Set max based on availability in selected bin
                    required
                    disabled={!item.binId} // Disable if no bin selected
                  />
                  {item.binId && <p className="text-xs text-gray-500 mt-1">Available in bin: {item.availableInBin || 0}</p>}
                </div>
                
                <div className="md:col-span-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className={`${buttonCssStyles} bg-red-500 hover:bg-red-600 p-2`}
                    disabled={isCreatingShipment}
                    title="Remove Item"
                  >
                    <Trash2Icon size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            className={`${buttonCssStyles} bg-blue-600 hover:bg-blue-700`}
            disabled={isCreatingShipment || items.length === 0}
          >
            {isCreatingShipment ? 'Creating Shipment...' : 'Create Shipment'}
          </button>
        </div>
      </form>
    </div>
  );
} 