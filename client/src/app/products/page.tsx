"use client";

import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  Product,
  ProductInput,
  Category
} from "@/state/api";
import { PlusCircleIcon, SearchIcon, EditIcon, TrashIcon } from "lucide-react";
import { useState, useEffect } from "react";
import Header from "@/app/(components)/Header";
import Rating from "@/app/(components)/Rating";
import CreateProductModal from "./CreateProductModal";
import Image from "next/image";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const {
    data: products,
    isLoading: isLoadingProducts,
    isError: isErrorProducts,
  } = useGetProductsQuery(searchTerm);

  const {
    data: categories,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
  } = useGetCategoriesQuery();

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (productData: ProductInput) => {
    try {
      if (editingProduct) {
        await updateProduct({ ...productData, productId: editingProduct.productId }).unwrap();
      } else {
        await createProduct(productData).unwrap();
      }
      handleModalClose();
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId).unwrap();
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  if (isLoadingProducts || isLoadingCategories) {
    return <div className="py-4">Loading...</div>;
  }

  if (isErrorProducts || isErrorCategories || !products || !categories) {
    return (
      <div className="text-center text-red-500 py-4">
        Failed to fetch data
      </div>
    );
  }

  return (
    <div className="mx-auto pb-5 w-full">
      <div className="mb-6">
        <div className="flex items-center border-2 border-gray-200 rounded">
          <SearchIcon className="w-5 h-5 text-gray-500 m-2" />
          <input
            className="w-full py-2 px-4 rounded bg-white"
            placeholder="Search products by name, SKU, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Header name="Products" />
        <button
          className="flex items-center bg-blue-500 hover:bg-blue-700 text-gray-200 font-bold py-2 px-4 rounded"
          onClick={handleOpenCreateModal}
        >
          <PlusCircleIcon className="w-5 h-5 mr-2 !text-gray-200" /> Create
          Product
        </button>
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="py-3 px-6">Image</th>
              <th scope="col" className="py-3 px-6">Name</th>
              <th scope="col" className="py-3 px-6">SKU</th>
              <th scope="col" className="py-3 px-6">Category</th>
              <th scope="col" className="py-3 px-6">Price</th>
              <th scope="col" className="py-3 px-6">Stock</th>
              <th scope="col" className="py-3 px-6">Dimensions</th>
              <th scope="col" className="py-3 px-6">Weight (kg)</th>
              <th scope="col" className="py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.productId} className="bg-white border-b hover:bg-gray-50">
                <td className="py-4 px-6">
                  <Image
                    src={`/images/product${index + 1}.jpg`}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded w-10 h-10 object-cover"
                  />
                </td>
                <th scope="row" className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                  {product.name}
                </th>
                <td className="py-4 px-6">{product.sku || 'N/A'}</td>
                <td className="py-4 px-6">{product.category?.name || 'Uncategorized'}</td>
                <td className="py-4 px-6">${product.price.toFixed(2)}</td>
                <td className="py-4 px-6">{product.stockQuantity}</td>
                <td className="py-4 px-6">{product.dimensions || 'N/A'}</td>
                <td className="py-4 px-6">{product.weight ? `${product.weight.toFixed(2)} kg` : 'N/A'}</td>
                <td className="py-4 px-6 flex items-center space-x-2">
                  <button onClick={() => handleOpenEditModal(product)} className="text-blue-600 hover:text-blue-900">
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDeleteProduct(product.productId)} className="text-red-600 hover:text-red-900">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
                <tr>
                    <td colSpan={9} className="text-center py-4">No products found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
         <CreateProductModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            onSave={handleSaveProduct}
            productData={editingProduct}
            categories={categories || []}
         />
      )}
    </div>
  );
};

export default Products;
