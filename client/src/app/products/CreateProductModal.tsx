import React, { ChangeEvent, FormEvent, useState, useEffect, useCallback } from "react";
import Header from "@/app/(components)/Header";
import {
  Product,
  ProductInput,
  Category,
  StorageBin,
  ProductLocation,
  useGetStorageBinsQuery,
  useGetProductLocationsQuery,
  useAssignProductToBinMutation,
  useUpdateProductQuantityInBinMutation,
  useRemoveProductFromBinMutation,
} from "@/state/api";
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";

// Toast component (can be extracted later)
const Toast = ({ message, onClose, type = 'success' }: { message: string, onClose: () => void, type?: 'success' | 'error' }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 right-5 ${bgColor} text-white py-3 px-5 rounded-md shadow-lg z-[100] flex items-center justify-between`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-3 text-xl font-semibold">&times;</button>
    </div>
  );
};

// Rename props to reflect it handles both create and edit
type ProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: ProductInput) => Promise<void>; // Make onSave async to handle loading states
  productData?: Product | null; // Optional product data for editing
  categories: Category[]; // Categories for dropdown
};

const ProductModal = ({
  isOpen,
  onClose,
  onSave,
  productData,
  categories,
}: ProductModalProps) => {
  const initialFormData: ProductInput = {
    name: "",
    sku: "",
    description: "",
    price: 0,
    stockQuantity: 0, // This will be the sum from productLocations
    dimensions: "",
    weight: 0,
    rating: 0,
    imageUrl: "",
    categoryId: null,
    minimumStockLevel: 0,
  };
  const [formData, setFormData] = useState<ProductInput>(initialFormData);
  const [productLocations, setProductLocations] = useState<ProductLocation[]>([]);
  const [selectedBinToAdd, setSelectedBinToAdd] = useState<string>("");
  const [quantityForNewBin, setQuantityForNewBin] = useState<number>(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!productData;

  // Fetch all storage bins for the dropdown
  const { data: allStorageBins, isLoading: isLoadingBins } = useGetStorageBinsQuery(undefined, { skip: !isOpen || !isEditing });

  // Fetch current product locations if editing a product
  const { data: currentProductLocations, isLoading: isLoadingLocations, refetch: refetchLocations } = 
    useGetProductLocationsQuery(
      { productId: productData?.productId! }, 
      { skip: !isOpen || !isEditing || !productData?.productId }
    );
  
  const [assignProductToBin, { isLoading: isAssigning }] = useAssignProductToBinMutation();
  const [updateProductQuantityInBin, { isLoading: isUpdatingQuantity }] = useUpdateProductQuantityInBinMutation();
  const [removeProductFromBin, { isLoading: isRemovingLocation }] = useRemoveProductFromBinMutation();

  useEffect(() => {
    if (isOpen) {
      if (isEditing && productData) {
        setFormData({
          name: productData.name || "",
          sku: productData.sku || "",
          description: productData.description || "",
          price: productData.price || 0,
          // stockQuantity will be derived from locations
          dimensions: productData.dimensions || "",
          weight: productData.weight || 0,
          rating: productData.rating || 0,
          imageUrl: productData.imageUrl || "",
          categoryId: productData.categoryId || null,
          stockQuantity: 0, // Will be set by the next effect
          minimumStockLevel: productData.minimumStockLevel || 0,
        });
        if (currentProductLocations) {
          setProductLocations(currentProductLocations);
        }
      } else {
        setFormData(initialFormData);
        setProductLocations([]);
      }
      setSelectedBinToAdd("");
      setQuantityForNewBin(1);
      setToast(null);
    }
  }, [productData, isEditing, isOpen, currentProductLocations]);
  
  // Effect to update total stock in formData when productLocations or currentProductLocations (on initial load) change
  useEffect(() => {
    const locationsToSum = currentProductLocations && isEditing ? currentProductLocations : productLocations;
    const totalStock = locationsToSum.reduce((sum, loc) => sum + loc.quantity, 0);
    setFormData(prev => ({ ...prev, stockQuantity: totalStock }));
  }, [productLocations, currentProductLocations, isEditing]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const isNumericField = ["price", "weight", "rating"].includes(name); // stockQuantity is read-only

    setFormData((prevData) => ({
      ...prevData,
      [name]: isNumericField
        ? value === "" ? null : parseFloat(value)
        : name === "categoryId"
        ? value === "" ? null : value
        : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditing && !formData.sku?.trim()) { // Check SKU only if not editing
        setToast({ message: "SKU is required when creating a new product.", type: 'error' });
        return;
    }
    if (!formData.name?.trim()) {
        setToast({ message: "Product Name is required.", type: 'error' });
        return;
    }
    setIsSaving(true);
    const calculatedTotalStock = productLocations.reduce((sum, loc) => sum + loc.quantity, 0);
    const submissionData: ProductInput = {
      ...formData,
      price: parseFloat(String(formData.price)) || 0,
      stockQuantity: calculatedTotalStock, 
      weight: formData.weight ? parseFloat(String(formData.weight)) : undefined,
      rating: formData.rating ? parseFloat(String(formData.rating)) : undefined,
      minimumStockLevel: typeof formData.minimumStockLevel === 'number' ? formData.minimumStockLevel : (formData.minimumStockLevel ? parseInt(String(formData.minimumStockLevel), 10) : undefined),
      categoryId: formData.categoryId === '' || formData.categoryId === null ? undefined : formData.categoryId, 
      imageUrl: formData.imageUrl === '' ? undefined : formData.imageUrl, 
    };
    try {
        await onSave(submissionData);
        // onClose will be called by parent on successful save
    } catch (error) {
        // Parent should handle toast for main save error
        console.error("Save error caught in modal:", error)
    }
    setIsSaving(false);
  };

  const handleLocationQuantityChange = async (locationId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      setToast({ message: "Quantity must be a positive number.", type: 'error' });
      return;
    }
    try {
      await updateProductQuantityInBin({ productLocationId: locationId, quantity: newQuantity }).unwrap();
      refetchLocations();
      setToast({ message: "Quantity updated.", type: 'success' });
    } catch (error: any) {
      console.error("Failed to update quantity:", error);
      setToast({ message: error?.data?.message || "Failed to update quantity.", type: 'error' });
    }
  };

  const handleRemoveLocation = async (locationId: string) => {
    try {
      await removeProductFromBin(locationId).unwrap();
      refetchLocations();
      setToast({ message: "Location removed.", type: 'success' });
    } catch (error: any) {
      console.error("Failed to remove location:", error);
      setToast({ message: error?.data?.message || "Failed to remove location.", type: 'error' });
    }
  };

  const handleAddProductToBin = async () => {
    if (!selectedBinToAdd || quantityForNewBin <= 0) {
      setToast({ message: "Please select a bin and enter a valid quantity.", type: 'error' });
      return;
    }
    // For new products, productData.productId won't exist yet. This action should ideally be disabled or handled differently.
    // For now, we assume this function is only available for existing products or that onSave is called first for new ones.
    const targetProductId = productData?.productId;
    if (!targetProductId && !isEditing) {
        setToast({ message: "Please save the new product first before assigning to bins.", type: 'error' });
        // OR: a more complex approach would be to queue these actions and run them after the main product save
        // For simplicity, we'll prevent it for now for brand new products not yet saved.
        // A better UX might be to allow adding locations visually, and they are only persisted on main product save.
        // This part of the workflow needs careful consideration based on desired UX for NEW products.
        // Current simple approach: Add locations only after initial product save.
        
        // Temporary: Add to local state for new product, persist on main save
        // This makes the UI feel responsive but adds complexity to handleSubmit
        const bin = allStorageBins?.find(b => b.binId === selectedBinToAdd);
        if (bin) {
             setProductLocations(prev => [...prev, { 
                productLocationId: `temp-${Date.now()}`,
                productId: "temp", // Temporary, will be replaced on actual save
                binId: selectedBinToAdd, 
                storageBin: { name: bin.name } as StorageBin, // Partial for display
                quantity: quantityForNewBin,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }]);
            setSelectedBinToAdd("");
            setQuantityForNewBin(1);
            return;
        }
    }

    if (!targetProductId && isEditing) {
         console.error("Product ID missing for an existing product. This shouldn't happen");
         setToast({ message: "Error: Product ID is missing.", type: 'error' });
         return;
    }
    
    // This block executes if it's an existing product (isEditing = true)
    if (targetProductId) {
        try {
          await assignProductToBin({ 
            productId: targetProductId, 
            binId: selectedBinToAdd, 
            quantity: quantityForNewBin 
          }).unwrap();
          refetchLocations();
          setSelectedBinToAdd("");
          setQuantityForNewBin(1);
          setToast({ message: "Product added to bin.", type: 'success' });
        } catch (error: any) {
          console.error("Failed to add product to bin:", error);
          setToast({ message: error?.data?.message || "Failed to add product to bin.", type: 'error' });
        }
    }
  };
  
  // Filter out bins that already have this product
  const availableBinsForAssignment = allStorageBins?.filter(
    bin => !productLocations.some(pl => pl.binId === bin.binId)
  ) || [];

  if (!isOpen) return null;

  const labelCssStyles = "block text-sm font-medium text-gray-700 mb-1";
  const inputCssStyles = "block w-full mb-3 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const textAreaCssStyles = "block w-full mb-3 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-24";
  const smallInputCssStyles = "p-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm w-16 text-center";

  const anyLocationLoading = isAssigning || isUpdatingQuantity || isRemovingLocation;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
        <div className={`relative mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white ${anyLocationLoading || isSaving ? 'opacity-75 pointer-events-none' : ''}`}>
          <Header name={isEditing ? "Edit Product" : "Create New Product"} />
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            {/* --- Row 1: Name & SKU --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className={labelCssStyles}>Product Name *</label>
                <input type="text" name="name" placeholder="Product Name" onChange={handleChange} value={formData.name} className={inputCssStyles} required />
              </div>
              <div>
                <label htmlFor="sku" className={labelCssStyles}>SKU {isEditing ? '(Optional)' : '*'}</label>
                <input type="text" name="sku" placeholder="Stock Keeping Unit" onChange={handleChange} value={formData.sku || ''} className={inputCssStyles} required={!isEditing} />
              </div>
            </div>

            {/* --- Description --- */}
            <div>
              <label htmlFor="description" className={labelCssStyles}>Description</label>
              <textarea name="description" placeholder="Product Description" onChange={handleChange} value={formData.description || ''} className={textAreaCssStyles} />
            </div>

            {/* --- Row 2: Price, Stock, Category --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className={labelCssStyles}>Price *</label>
                <input type="number" step="0.01" name="price" placeholder="0.00" onChange={handleChange} value={formData.price ?? ''} className={inputCssStyles} required />
              </div>
              <div>
                <label htmlFor="stockQuantity" className={labelCssStyles}>Total Stock</label>
                <input type="number" name="stockQuantity" readOnly placeholder="0" value={formData.stockQuantity} className={inputCssStyles + " bg-gray-100 cursor-not-allowed"} title="Total stock is calculated from bin locations" />
              </div>
              <div>
                <label htmlFor="categoryId" className={labelCssStyles}>Category</label>
                <select name="categoryId" onChange={handleChange} value={formData.categoryId || ""} className={inputCssStyles}>
                  <option value="">-- No Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* --- Row 3: Dimensions, Weight, Rating --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="dimensions" className={labelCssStyles}>Dimensions (LxWxH cm)</label>
                <input type="text" name="dimensions" placeholder="e.g., 10x5x2" onChange={handleChange} value={formData.dimensions || ''} className={inputCssStyles} />
              </div>
              <div>
                <label htmlFor="weight" className={labelCssStyles}>Weight (kg)</label>
                <input type="number" step="0.01" name="weight" placeholder="0.00" onChange={handleChange} value={formData.weight ?? ''} className={inputCssStyles} />
              </div>
              <div>
                <label htmlFor="rating" className={labelCssStyles}>Rating (1-5)</label>
                <input type="number" step="0.1" min="0" max="5" name="rating" placeholder="0.0" onChange={handleChange} value={formData.rating ?? ''} className={inputCssStyles} />
              </div>
            </div>

            {/* --- Row 4: Minimum Stock Level --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="minimumStockLevel" className={labelCssStyles}>Minimum Stock Level</label>
                <input type="number" name="minimumStockLevel" placeholder="e.g., 10" onChange={handleChange} value={formData.minimumStockLevel ?? ''} className={inputCssStyles} />
              </div>
            </div>

            {/* --- Image URL --- */}
            <div>
              <label htmlFor="imageUrl" className={labelCssStyles}>Image URL</label>
              <input type="text" name="imageUrl" placeholder="https://example.com/image.jpg" onChange={handleChange} value={formData.imageUrl || ''} className={inputCssStyles} />
            </div>

            {/* --- Product Locations Management (Visible for New and Editing) --- */}
            <div className="pt-4 border-t mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Storage Locations</h3>
              {(isLoadingLocations && isEditing) && <p>Loading locations...</p>} {/* Only show loading for existing product locations */}
              {productLocations.length === 0 && <p className="text-sm text-gray-500">This product is not currently stored in any bin. Add locations below.</p>}
              
              {productLocations.map(loc => (
                <div key={loc.productLocationId} className="flex items-center justify-between p-2 border-b last:border-b-0">
                  <div>
                    <span className="font-medium">{loc.storageBin?.name || (allStorageBins?.find(b=>b.binId === loc.binId)?.name) || 'Unknown Bin'}</span>
                    <span className="text-sm text-gray-500 ml-2">(ID: {loc.binId?.substring(0,8)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      defaultValue={loc.quantity} // Use defaultValue for temp items, or value if IDs are real
                      onBlur={(e) => loc.productLocationId.startsWith('temp-') ? 
                                      setProductLocations(prev => prev.map(l => l.productLocationId === loc.productLocationId ? {...l, quantity: parseInt(e.target.value) || 1} : l)) :
                                      handleLocationQuantityChange(loc.productLocationId, e.target.value)
                                  }
                      className={smallInputCssStyles}
                      min="1"
                      disabled={anyLocationLoading || isSaving}
                    />
                    <button 
                      type="button" 
                      onClick={() => loc.productLocationId.startsWith('temp-') ? 
                                      setProductLocations(prev => prev.filter(l => l.productLocationId !== loc.productLocationId)) :
                                      handleRemoveLocation(loc.productLocationId)}
                      className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                      disabled={anyLocationLoading || isSaving}
                    >
                      <Trash2Icon size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t">
                <h4 className="text-md font-medium text-gray-800 mb-1">Add to a new bin:</h4>
                {isLoadingBins && <p>Loading bins...</p>}
                {!isLoadingBins && availableBinsForAssignment.length === 0 && (!isEditing || productLocations.length > 0) && <p className="text-sm text-gray-500">No other bins available, or product is in all bins.</p>}
                {(!isLoadingBins && (availableBinsForAssignment.length > 0 || (productLocations.length === 0 && !isEditing ))) && (
                  <div className="flex items-center gap-2">
                    <select 
                      value={selectedBinToAdd} 
                      onChange={(e) => setSelectedBinToAdd(e.target.value)}
                      className={inputCssStyles + " mb-0 flex-grow"}
                      disabled={anyLocationLoading || isSaving}
                    >
                      <option value="">-- Select a Bin --</option>
                      {availableBinsForAssignment.map(bin => (
                        <option key={bin.binId} value={bin.binId}>{bin.name}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      value={quantityForNewBin}
                      onChange={(e) => setQuantityForNewBin(parseInt(e.target.value) || 1)}
                      className={smallInputCssStyles + " mb-0"}
                      min="1"
                      placeholder="Qty"
                      disabled={anyLocationLoading || isSaving}
                    />
                    <button 
                      type="button" 
                      onClick={handleAddProductToBin} 
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded disabled:opacity-50"
                      disabled={!selectedBinToAdd || quantityForNewBin <= 0 || anyLocationLoading || isSaving}
                    >
                      <PlusIcon size={18}/>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* --- Actions --- */}
            <div className="flex justify-end items-center pt-6 border-t border-gray-200">
              <button onClick={onClose} type="button" className="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400" disabled={anyLocationLoading || isSaving}>
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 disabled:opacity-50" disabled={anyLocationLoading || isSaving}>
                {isSaving ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? "Save Changes" : "Create Product")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProductModal;
