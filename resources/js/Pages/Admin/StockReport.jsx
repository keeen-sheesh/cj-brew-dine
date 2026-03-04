import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useApi } from '@/hooks/useApi';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import { formatPeso, formatDate } from '@/utils/helpers';

export default function StockReport() {
  const { get, loading } = useApi();
  const [reportData, setReportData] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [stockValue, setStockValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      const [paidTransaction, items, itemsDetail] = await Promise.all([
        get(`/transactions/summary/generate?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`),
        get('/items/low-stock/list?per_page=50'),
        get('/items?per_page=1000'),
      ]);

      setReportData(paidTransaction || []);
      setLowStockItems(items.data || []);

      // Calculate total stock value
      const value = (itemsDetail.data || []).reduce((sum, item) => {
        return sum + (item.price || 0) * item.stock_quantity;
      }, 0);
      setStockValue(value);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Exporting report...');
  };

  // Prepare chart data
  const chartData = reportData ? reportData.slice(0, 10).map((item) => ({
    name: item.item_name.substring(0, 15),
    in: item.total_in,
    out: item.total_out,
    net: item.net_change,
  })) : [];

  // Stock value distribution
  const stockDistribution = lowStockItems.slice(0, 5).map((item) => ({
    name: item.name.substring(0, 20),
    value: (item.price || 0) * item.stock_quantity,
  }));

  const COLORS = ['#2ecc71', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-resto-900">Stock Report & Analytics</h1>
            <p className="text-gray-600 mt-1">Inventory insights and stock movement trends</p>
          </div>
          <PrimaryButton onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </PrimaryButton>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white border border-resto-200 rounded-lg p-4">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-resto-500"
              />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-resto-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Total Stock Value</p>
            <p className="text-3xl font-bold text-resto-900">{formatPeso(stockValue)}</p>
            <p className="text-xs text-gray-600 mt-2">Based on current inventory</p>
          </div>
          <div className="bg-white border border-resto-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Low Stock Items</p>
            <p className="text-3xl font-bold text-warning-600">{lowStockItems.length}</p>
            <p className="text-xs text-gray-600 mt-2">Items below threshold</p>
          </div>
          <div className="bg-white border border-resto-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Date Range</p>
            <p className="text-lg font-bold text-resto-900">
              {formatDate(dateRange.start_date)} - {formatDate(dateRange.end_date)}
            </p>
            <p className="text-xs text-gray-600 mt-2">Selected period</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Movement Chart */}
          <div className="bg-white border border-resto-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-resto-900 mb-4">Stock Movement (Top 10 Items)</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="in" stackId="a" fill="#2ecc71" name="Stock In" />
                  <Bar dataKey="out" stackId="a" fill="#ef4444" name="Stock Out" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500">
                No data available for selected period
              </div>
            )}
          </div>

          {/* Stock Distribution Pie Chart */}
          <div className="bg-white border border-resto-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-resto-900 mb-4">Stock Value Distribution</h3>
            {stockDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatPeso(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Items Table */}
        {lowStockItems.length > 0 && (
          <div className="bg-white border border-resto-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-resto-900 mb-4">Low Stock Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-resto-50 border-b border-resto-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Item Name</th>
                    <th className="px-4 py-2 text-right font-semibold">Current Stock</th>
                    <th className="px-4 py-2 text-right font-semibold">Threshold</th>
                    <th className="px-4 py-2 text-right font-semibold">Unit Price</th>
                    <th className="px-4 py-2 text-right font-semibold">Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.slice(0, 10).map((item) => (
                    <tr key={item.id} className="border-b border-resto-200 hover:bg-resto-50">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3 text-right text-warning-600 font-medium">
                        {item.stock_quantity}
                      </td>
                      <td className="px-4 py-3 text-right">{item.low_stock_threshold}</td>
                      <td className="px-4 py-3 text-right">{formatPeso(item.price || 0)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPeso((item.price || 0) * item.stock_quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
