import React from 'react';
import { formatPeso } from '@/utils/helpers';
import { StockStatusBadge, StockProgressBar } from './StockStatusBadge';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';

export const ItemTable = ({
  items,
  loading = false,
  onEdit,
  onDelete,
  onAdjustStock,
}) => {
  if (loading) {
    return (
      <div className="bg-white border border-resto-200 rounded-lg p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin">
            <div className="w-8 h-8 border-4 border-resto-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-resto-200 rounded-lg p-8">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No items found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-resto-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-resto-50 border-b border-resto-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-resto-900">Item Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-resto-900">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-resto-900">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-resto-900">Stock</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-resto-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-resto-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-resto-200 hover:bg-resto-50 transition">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-resto-900">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600 truncate">{item.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{item.category?.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-resto-900">
                    {item.price ? formatPeso(item.price) : 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-resto-900">
                      {item.stock_quantity} units
                    </div>
                    <StockProgressBar
                      quantity={item.stock_quantity}
                      threshold={item.low_stock_threshold}
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StockStatusBadge
                    quantity={item.stock_quantity}
                    threshold={item.low_stock_threshold}
                    showLabel={true}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {onAdjustStock && (
                      <button
                        onClick={() => onAdjustStock(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Adjust Stock"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
