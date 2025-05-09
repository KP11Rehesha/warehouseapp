"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/app/(components)/Header';
import { 
  useGetExpensesQuery, 
  useCreateExpenseMutation, 
  useUpdateExpenseMutation, 
  useDeleteExpenseMutation, 
  Expense, 
  ExpenseInput,
  useGetCategoriesQuery,
  Category,
  ExpenseFilterParams
} from '@/state/api';
import { PlusCircleIcon, EditIcon, TrashIcon, FilterIcon } from 'lucide-react';

const ExpensesPage = () => {
  // Filter state
  const [filters, setFilters] = useState<ExpenseFilterParams>({
    startDate: '',
    endDate: '',
    categoryId: '',
    minAmount: '',
    maxAmount: ''
  });
  
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const filterParams = isFilterApplied ? filters : undefined;
  
  const { data: expenses, isLoading, isError, error: expensesError } = useGetExpensesQuery(filterParams);
  const { data: categories } = useGetCategoriesQuery();
  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseInput>({
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Default to today
    categoryId: undefined,
  });
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (expensesError && 'data' in expensesError) {
      const errorData = expensesError.data as { message?: string };
      setPageError(errorData.message || 'An unexpected error occurred while fetching expenses.');
    } else if (expensesError) {
      setPageError('Failed to fetch expenses.');
    }
  }, [expensesError]);

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount,
        date: new Date(expense.date).toISOString().split('T')[0],
        categoryId: expense.categoryId || undefined,
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        categoryId: undefined,
      });
    }
    setIsModalOpen(true);
    setPageError(null); // Clear previous page errors when opening modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const applyFilters = () => {
    setIsFilterApplied(true);
  };
  
  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      categoryId: '',
      minAmount: '',
      maxAmount: ''
    });
    setIsFilterApplied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPageError(null);
    try {
      if (editingExpense) {
        await updateExpense({ ...formData, expenseId: editingExpense.expenseId }).unwrap();
      } else {
        await createExpense(formData).unwrap();
      }
      handleCloseModal();
    } catch (err: any) {
      console.error("Failed to save expense:", err);
      setPageError(err.data?.message || err.message || "Failed to save expense. Please try again.");
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      setPageError(null);
      try {
        await deleteExpense(expenseId).unwrap();
      } catch (err: any) {
        console.error("Failed to delete expense:", err);
        setPageError(err.data?.message || err.message || "Failed to delete expense. Please try again.");
      }
    }
  };

  if (isLoading) return <div className="p-4">Loading expenses...</div>;
  if (isError && !expenses) return <div className="p-4 text-red-500">Error: {pageError || 'Could not load expenses.'}</div>;

  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Header name="Manage Expenses" />
      
      {pageError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{pageError}</span>
        </div>
      )}

      <div className="mb-6 flex justify-between">
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)} 
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow flex items-center transition ease-in-out duration-150"
        >
          <FilterIcon className="w-5 h-5 mr-2" /> {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow flex items-center transition ease-in-out duration-150"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" /> Add Expense
        </button>
      </div>
      
      {/* Filters Panel */}
      {isFilterOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">Filter Expenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" 
                id="startDate" 
                name="startDate" 
                value={filters.startDate} 
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="date" 
                id="endDate" 
                name="endDate" 
                value={filters.endDate} 
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                id="categoryId" 
                name="categoryId" 
                value={filters.categoryId} 
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
              >
                <option value="">All Categories</option>
                {categories?.map((cat: Category) => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input 
                type="number" 
                id="minAmount" 
                name="minAmount" 
                value={filters.minAmount} 
                onChange={handleFilterChange}
                step="0.01"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
              <input 
                type="number" 
                id="maxAmount" 
                name="maxAmount" 
                value={filters.maxAmount} 
                onChange={handleFilterChange}
                step="0.01"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-end space-x-3">
              <button 
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition ease-in-out duration-150"
                disabled={!hasActiveFilters}
              >
                Apply Filters
              </button>
              <button 
                onClick={clearFilters}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition ease-in-out duration-150"
                disabled={!hasActiveFilters && !isFilterApplied}
              >
                Clear Filters
              </button>
            </div>
          </div>
          {isFilterApplied && expenses && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {expenses.length} filtered results
            </div>
          )}
        </div>
      )}

      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-800 text-white">
            <tr>
              {['Description', 'Amount', 'Date', 'Category', 'Actions'].map(head => (
                <th key={head} scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses && expenses.length > 0 ? expenses.map((expense) => (
              <tr key={expense.expenseId} className="hover:bg-gray-100 transition duration-150 ease-in-out">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${expense.amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {expense.category ? expense.category.name : (expense.categoryId ? 'Loading...' : 'N/A')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                  <button onClick={() => handleOpenModal(expense)} className="text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out">
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(expense.expenseId)} className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-lg">
                  {isFilterApplied ? 'No expenses match your filters.' : 'No expenses recorded yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center" onClick={handleCloseModal}> 
          <div className="relative mx-auto p-8 border w-full max-w-md shadow-2xl rounded-xl bg-white" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  required 
                  rows={3}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input 
                  type="number" 
                  id="amount" 
                  name="amount" 
                  value={formData.amount} 
                  onChange={handleChange} 
                  required 
                  step="0.01"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  id="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange} 
                  required 
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  id="categoryId" 
                  name="categoryId" 
                  value={formData.categoryId || ''} 
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                >
                  <option value="">Select a category (optional)</option>
                  {categories?.map((cat: Category) => (
                    <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end space-x-4 pt-2">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition ease-in-out duration-150"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ease-in-out duration-150"
                >
                  {editingExpense ? 'Update Expense' : 'Create Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
