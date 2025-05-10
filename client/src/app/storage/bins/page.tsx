"use client";

import { useState } from "react";
import {
  useGetStorageBinsQuery,
  useCreateStorageBinMutation,
  useUpdateStorageBinMutation,
  useDeleteStorageBinMutation,
  StorageBin,
  StorageBinInput,
} from "@/state/api";
import Header from "@/app/(components)/Header";
import { PlusCircleIcon, EditIcon, TrashIcon, SearchIcon } from "lucide-react";
import StorageBinModal from "./StorageBinModal";

const StorageBinsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<StorageBin | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    data: storageBins,
    isLoading,
    isError,
    refetch,
  } = useGetStorageBinsQuery();
  const [createStorageBin, { isLoading: isCreating }] = useCreateStorageBinMutation();
  const [updateStorageBin, { isLoading: isUpdating }] = useUpdateStorageBinMutation();
  const [deleteStorageBin] = useDeleteStorageBinMutation();

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenCreateModal = () => {
    setEditingBin(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (bin: StorageBin) => {
    setEditingBin(bin);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingBin(null);
  };

  const handleSaveBin = async (formData: StorageBinInput) => {
    try {
      if (editingBin) {
        await updateStorageBin({ ...formData, binId: editingBin.binId }).unwrap();
        showToast("Storage bin updated successfully!");
      } else {
        await createStorageBin(formData).unwrap();
        showToast("Storage bin created successfully!");
      }
      handleModalClose();
      refetch();
    } catch (error: any) {
      console.error("Failed to save storage bin:", error);
      showToast(error?.data?.message || "Failed to save storage bin.");
    }
  };

  const handleDeleteBin = async (binId: string) => {
    if (window.confirm("Are you sure you want to delete this storage bin? This action cannot be undone.")) {
      try {
        await deleteStorageBin(binId).unwrap();
        showToast("Storage bin deleted successfully!");
        refetch();
      } catch (error: any) {
        console.error("Failed to delete storage bin:", error);
        showToast(error?.data?.message || "Failed to delete storage bin. Make sure it's empty.");
      }
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center">Loading storage bins...</div>;
  }

  if (isError || !storageBins) {
    return (
      <div className="py-4 text-center text-red-500">
        Error fetching storage bins.
      </div>
    );
  }
  
  const filteredBins = storageBins.filter(bin => 
    bin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bin.locationDescription && bin.locationDescription.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="mx-auto pb-5 w-full relative">
      {toastMessage && (
        <div className="fixed top-20 right-5 bg-green-500 text-white py-2 px-4 rounded-md shadow-lg z-[100]">
          {toastMessage}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center border-2 border-gray-200 rounded">
          <SearchIcon className="w-5 h-5 text-gray-500 m-2" />
          <input
            className="w-full py-2 px-4 rounded bg-white"
            placeholder="Search bins by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Header name="Storage Bins" />
        <button
          className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={handleOpenCreateModal}
          disabled={isCreating || isUpdating}
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" /> Create Bin
        </button>
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="py-3 px-6">Name / Code</th>
              <th scope="col" className="py-3 px-6">Location Description</th>
              <th scope="col" className="py-3 px-6">Dimensions</th>
              <th scope="col" className="py-3 px-6">Max Weight (kg)</th>
              <th scope="col" className="py-3 px-6">Max Units</th>
              <th scope="col" className="py-3 px-6">Products (#)</th>
              <th scope="col" className="py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBins.map((bin) => (
              <tr key={bin.binId} className="bg-white border-b hover:bg-gray-50">
                <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                  {bin.name}
                </td>
                <td className="py-4 px-6">{bin.locationDescription || "N/A"}</td>
                <td className="py-4 px-6">{bin.dimensions || "N/A"}</td>
                <td className="py-4 px-6">{bin.maxCapacityWeight?.toString() || "N/A"}</td>
                <td className="py-4 px-6">{bin.maxCapacityUnits?.toString() || "N/A"}</td>
                <td className="py-4 px-6">{bin.productLocations?.length || 0}</td>
                <td className="py-4 px-6 flex items-center space-x-2">
                  <button 
                    onClick={() => handleOpenEditModal(bin)} 
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                    disabled={isCreating || isUpdating}
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteBin(bin.binId)} 
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    disabled={isCreating || isUpdating}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredBins.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No storage bins found{searchTerm && " matching your search"}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <StorageBinModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleSaveBin}
          binData={editingBin}
        />
      )}
    </div>
  );
};

export default StorageBinsPage; 