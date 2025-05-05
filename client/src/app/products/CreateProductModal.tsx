import React, { ChangeEvent, FormEvent, useState, useEffect } from "react";
import Header from "@/app/(components)/Header";
import { Product, ProductInput, Category } from "@/state/api"; // Import updated interfaces

// Rename props to reflect it handles both create and edit
type ProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: ProductInput) => void; // Changed from onCreate to onSave
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
  // Use ProductInput type for form state
  const [formData, setFormData] = useState<ProductInput>({
    name: "",
    sku: "",
    description: "",
    price: 0,
    stockQuantity: 0,
    dimensions: "",
    weight: 0,
    rating: 0,
    categoryId: null,
  });

  const isEditing = !!productData; // Determine if we are editing

  // Effect to populate form when productData changes (for editing)
  useEffect(() => {
    if (isEditing && productData) {
      setFormData({
        name: productData.name || "",
        sku: productData.sku || "", // Handle potentially null SKU
        description: productData.description || "",
        price: productData.price || 0,
        stockQuantity: productData.stockQuantity || 0,
        dimensions: productData.dimensions || "",
        weight: productData.weight || 0,
        rating: productData.rating || 0,
        categoryId: productData.categoryId || null,
      });
    } else {
      // Reset form for creating a new product
      setFormData({
        name: "",
        sku: "",
        description: "",
        price: 0,
        stockQuantity: 0,
        dimensions: "",
        weight: 0,
        rating: 0,
        categoryId: null,
      });
    }
  }, [productData, isEditing, isOpen]); // Rerun when modal opens or productData changes

  // Unified change handler for inputs and select
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "price" || name === "weight" || name === "rating"
          ? value === '' ? null : parseFloat(value) // Handle empty string for optional numbers
          : name === "stockQuantity"
          ? value === '' ? 0 : parseInt(value, 10) // Handle empty string for required number
          : name === "categoryId"
          ? value === "" ? null : value // Handle "No Category" selection
          : value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Basic SKU validation (can be enhanced)
    if (!isEditing && !formData.sku) {
        alert("SKU is required when creating a product."); // Simple alert, replace with better UI
        return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  const labelCssStyles = "block text-sm font-medium text-gray-700 mb-1";
  const inputCssStyles =
    "block w-full mb-3 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const textAreaCssStyles =
    "block w-full mb-3 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-24";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <Header name={isEditing ? "Edit Product" : "Create New Product"} />
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
              <input type="number" step="0.01" name="price" placeholder="0.00" onChange={handleChange} value={formData.price} className={inputCssStyles} required />
            </div>
            <div>
              <label htmlFor="stockQuantity" className={labelCssStyles}>Stock Qty *</label>
              <input type="number" name="stockQuantity" placeholder="0" onChange={handleChange} value={formData.stockQuantity} className={inputCssStyles} required />
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

          {/* --- Actions --- */}
          <div className="flex justify-end items-center pt-4 border-t border-gray-200">
            <button onClick={onClose} type="button" className="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
              {isEditing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal; // Renamed export
