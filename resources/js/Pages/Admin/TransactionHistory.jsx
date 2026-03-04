import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useApi } from '@/hooks/useApi';
import PrimaryButton from '@/Components/PrimaryButton';
import { Plus, Calendar, Download } from 'lucide-react';
import { formatDateTime, getTransactionTypeLabel, formatPeso } from '@/utils/helpers';

export default function TransactionHistory() {
  const { get, loading } = useApi();
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({
    item_id: '',
    type: '',
    start_date: '',
    end_date: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchData();
  }, [currentPage, filters]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      
      if (filters.item_id) params.append('item_id', filters.item_id);
      if (filters.type) params.append('type', filters.type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const [transactionsRes, itemsRes] = await Promise.all([
        get(`/transactions?${params.toString()}`),
        get('/items'),
      ]);

      setTransactions(transactionsRes.data || []);
      setPagination(transactionsRes.meta || {});
      setItems(itemsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export transactions');
  };

  const getTransactionIcon = (type) => {
    const icons = {
      in: '📥',
      out: '📤',
      adjustment: '⚙️',
      damage: '🔨',
      expired: '⏰',
    };
    return icons[type] || '📋';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-resto-900">Transaction History</h1>
            <p className="text-gray-600 mt-1">View all inventory transactions and adjustments</p>
          </div>
          <PrimaryButton onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </PrimaryButton>
        </div>

        {/* Filters */}
        <div className="bg-white border border-resto-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-resto-900">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <select
                value={filters.item_id}
                onChange={(e) => handleFilterChange('item_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500"
              >
                <option value="">All Items</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500"
              >
                <option value="">All Types</option>
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
                <option value="damage">Damage</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white border border-resto-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-resto-50 border-b border-resto-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-resto-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-resto-900">Item</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-resto-900">Type</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-resto-900">Quantity</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-resto-900">Before</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-resto-900">After</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-resto-900">Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const typeInfo = getTransactionTypeLabel(transaction.type);
                  return (
                    <tr key={transaction.id} className="border-b border-resto-200 hover:bg-resto-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDateTime(transaction.transaction_date)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-resto-900">{transaction.item?.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${typeInfo.color}-50 text-${typeInfo.color}-700`}
                        >
                          {getTransactionIcon(transaction.type)} {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-resto-900">
                        {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {transaction.quantity_before}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-resto-900">
                        {transaction.quantity_after}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transaction.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="bg-resto-50 border-t border-resto-200 px-6 py-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Page {pagination.current_page} of {pagination.last_page}
              </p>
              <div className="flexgap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-white"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                  disabled={currentPage === pagination.last_page}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
