import React, { ChangeEvent, FormEvent, useState, useEffect } from "react";
import Header from "@/app/(components)/Header";
import { StorageBin, StorageBinInput } from "@/state/api";

type StorageBinModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: StorageBinInput) => void;
  binData?: StorageBin | null; // Optional bin data for editing
};

const StorageBinModal = ({
  isOpen,
  onClose,
  onSave,
  binData,
}: StorageBinModalProps) => {
  const [formData, setFormData] = useState<StorageBinInput>({
    name: "",
    locationDescription: "",
    dimensions: "",
    maxCapacityWeight: undefined, // Use undefined for optional numbers to avoid sending 0
    maxCapacityUnits: undefined,
  });

  const isEditing = !!binData;

  useEffect(() => {
    if (isOpen) { // Reset or populate form when modal opens
      if (isEditing && binData) {
        setFormData({
          name: binData.name || "",
          locationDescription: binData.locationDescription || "",
          dimensions: binData.dimensions || "",
          maxCapacityWeight: binData.maxCapacityWeight ?? undefined,
          maxCapacityUnits: binData.maxCapacityUnits ?? undefined,
        });
      } else {
        // Reset form for creating a new bin
        setFormData({
          name: "",
          locationDescription: "",
          dimensions: "",
          maxCapacityWeight: undefined,
          maxCapacityUnits: undefined,
        });
      }
    }
  }, [binData, isEditing, isOpen]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "maxCapacityWeight" || name === "maxCapacityUnits"
          ? value === "" ? undefined : parseFloat(value) // Handle empty string for optional numbers
          : value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        alert("Bin Name/Code is required."); // Simple alert, can be replaced with better UI feedback
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
        <Header name={isEditing ? "Edit Storage Bin" : "Create New Storage Bin"} />
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className={labelCssStyles}>Name / Code *</label>
            <input type="text" name="name" placeholder="e.g., A01-S01-B01" onChange={handleChange} value={formData.name} className={inputCssStyles} required />
          </div>

          <div>
            <label htmlFor="locationDescription" className={labelCssStyles}>Location Description</label>
            <textarea name="locationDescription" placeholder="e.g., Aisle 1, Shelf 1, Bin 1" onChange={handleChange} value={formData.locationDescription || ''} className={textAreaCssStyles} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dimensions" className={labelCssStyles}>Dimensions</label>
              <input type="text" name="dimensions" placeholder="e.g., 100x50x30 cm" onChange={handleChange} value={formData.dimensions || ''} className={inputCssStyles} />
            </div>
            <div>
              <label htmlFor="maxCapacityWeight" className={labelCssStyles}>Max Weight (kg)</label>
              <input type="number" step="0.01" name="maxCapacityWeight" placeholder="e.g., 50.5" onChange={handleChange} value={formData.maxCapacityWeight ?? ''} className={inputCssStyles} />
            </div>
          </div>

          <div>
            <label htmlFor="maxCapacityUnits" className={labelCssStyles}>Max Units</label>
            <input type="number" name="maxCapacityUnits" placeholder="e.g., 100" onChange={handleChange} value={formData.maxCapacityUnits ?? ''} className={inputCssStyles} />
          </div>

          <div className="flex justify-end items-center pt-4 border-t border-gray-200">
            <button onClick={onClose} type="button" className="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
              {isEditing ? "Save Changes" : "Create Bin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StorageBinModal; 