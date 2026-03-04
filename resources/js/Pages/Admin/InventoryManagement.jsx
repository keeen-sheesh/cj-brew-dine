import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useApi } from '@/hooks/useApi';
import { ItemTable } from '@/Components/Inventory/ItemTable';
import { StockAdjustmentModal } from '@/Components/Inventory/StockAdjustmentModal';
import PrimaryButton from '@/Components/PrimaryButton';
import { Plus, Search } from 'lucide-react';

export default function InventoryManagement() {
  const { data: itemsData, loading, get, post } = useApi();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 1000;

  useEffect(() => {
    fetchItems();
  }, [currentPage]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchItems();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchItems = async () => {
    try {
      const response = await get(`/items?page=${currentPage}&per_page=${PER_PAGE}&search=${encodeURIComponent(searchTerm)}`);
      setItems(response.data || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleAdjustStock = (item) => {
    setSelectedItem(item);
    setShowAdjustmentModal(true);
  };

  const handleSubmitAdjustment = async (quantity, type, notes) => {
    if (!selectedItem) return;

    try {
      await post('/transactions', {
        item_id: selectedItem.id,
        type,
        quantity,
        notes,
        transaction_date: new Date().toISOString(),
      });

      // Refresh items list
      fetchItems();
      setShowAdjustmentModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      throw error;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-resto-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Manage your restaurant items and stock levels</p>
          </div>
          <PrimaryButton>
            <Plus className="w-4 h-4 mr-2" />
            Add New Item
          </PrimaryButton>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border border-resto-200 rounded-lg p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500">
              <option value="">All Categories</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Items Table */}
        <ItemTable
          items={items}
          loading={loading}
          onAdjustStock={handleAdjustStock}
          onEdit={(item) => console.log('Edit:', item)}
          onDelete={(item) => console.log('Delete:', item)}
        />

        {/* Stock Adjustment Modal */}
        {selectedItem && (
          <StockAdjustmentModal
            isOpen={showAdjustmentModal}
            itemName={selectedItem.name}
            currentStock={selectedItem.stock_quantity}
            onClose={() => {
              setShowAdjustmentModal(false);
              setSelectedItem(null);
            }}
            onSubmit={handleSubmitAdjustment}
          />
        )}
      </div>
    </AdminLayout>
  );
}
