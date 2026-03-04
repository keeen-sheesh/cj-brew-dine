import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { StockStatusBadge, StockInfoCard } from '@/Components/Inventory/StockStatusBadge';
import { formatPeso } from '@/utils/helpers';

export default function InventoryDashboard() {
  const { get } = useApi();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [categoriesRes, lowStock, outOfStock] = await Promise.all([
        get('/categories/active/all'),
        get('/items/low-stock/list?per_page=5'),
        get('/items?is_available=false&per_page=5'),
      ]);

      setCategories(categoriesRes);
      setLowStockItems(lowStock.data || []);
      setOutOfStockItems(outOfStock.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const totalItems = categories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
  const totalLowStock = lowStockItems.length;
  const totalOutOfStock = outOfStockItems.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-resto-900">Inventory Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your restaurant inventory and stock levels</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StockInfoCard
            label="Total Items"
            value={totalItems}
            trend={totalItems > 0 ? 'up' : 'stable'}
          />
          <StockInfoCard
            label="Categories"
            value={categories.length}
            trend="stable"
          />
          <StockInfoCard
            label="Low Stock Items"
            value={totalLowStock}
            trend={totalLowStock > 0 ? 'down' : 'stable'}
          />
          <StockInfoCard
            label="Out of Stock"
            value={totalOutOfStock}
            trend={totalOutOfStock > 0 ? 'down' : 'stable'}
          />
        </div>

        {/* Alerts Section */}
        {totalOutOfStock > 0 && (
          <div className="bg-critical-50 border-l-4 border-critical-600 p-4 rounded-lg">
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-critical-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-critical-900 mb-2">Critical Alert: Out of Stock Items</h3>
                <p className="text-critical-800">{totalOutOfStock} items are currently out of stock</p>
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Items */}
        {lowStockItems.length > 0 && (
          <div className="bg-white border border-resto-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-warning-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning-600" />
              </div>
              <h2 className="text-xl font-semibold text-resto-900">Low Stock Items</h2>
            </div>

            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-warning-50 rounded-lg border border-warning-200">
                  <div>
                    <p className="font-medium text-resto-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.stock_quantity} / {item.low_stock_threshold} threshold
                    </p>
                  </div>
                  <StockStatusBadge
                    quantity={item.stock_quantity}
                    threshold={item.low_stock_threshold}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Overview */}
        <div className="bg-white border border-resto-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-resto-900 mb-4">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-4 border border-resto-200 rounded-lg hover:bg-resto-50 transition"
              >
                <h3 className="font-semibold text-resto-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {category.items?.length || 0} items
                </p>
                {category.items && category.items.length > 0 && (
                  <div className="space-y-2">
                    {category.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="text-sm">
                        <p className="text-gray-700">{item.name}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-600">{item.stock_quantity} units</span>
                          <StockStatusBadge
                            quantity={item.stock_quantity}
                            threshold={item.low_stock_threshold}
                            showLabel={false}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
