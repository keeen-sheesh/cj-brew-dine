import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// Format currency in Philippine Peso
const formatPeso = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Format date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Reports({ auth, salesData = [], expensesData = [], salesRecordsData = [], topItems = [], stockAlerts = [], startDate, endDate, totals }) {
    const { data, setData, post, processing, errors } = useForm({
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || new Date().toISOString().split('T')[0],
    });

    const [activeTab, setActiveTab] = useState('overview');
    const [pdfPreview, setPdfPreview] = useState(false);

    // Prepare chart data
    const profitChartData = salesData.map((sale, index) => {
        const expenseDay = expensesData.find(e => e.date === sale.date);
        return {
            date: formatDate(sale.date),
            revenue: parseFloat(sale.revenue) || 0,
            expenses: expenseDay ? parseFloat(expenseDay.total_expenses) : 0,
        };
    });

    const ordersChartData = salesData.map(sale => ({
        date: formatDate(sale.date),
        orders: parseInt(sale.orders) || 0,
    }));

    const topItemsChartData = topItems.slice(0, 5).map(item => ({
        name: item.name,
        revenue: parseFloat(item.total_revenue) || 0,
        quantity: parseInt(item.total_quantity) || 0,
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    // Calculate max values for dynamic Y-axis
    const maxRevenue = profitChartData.length > 0 
        ? Math.max(...profitChartData.map(d => d.revenue), ...profitChartData.map(d => d.expenses))
        : 0;
    
    const maxOrders = ordersChartData.length > 0
        ? Math.max(...ordersChartData.map(d => d.orders))
        : 0;

    // Generate dynamic Y-axis ticks
    const generateRevenueTicks = () => {
        if (maxRevenue === 0) return [0, 500, 1000];
        
        const roundedMax = Math.ceil(maxRevenue / 500) * 500;
        const ticks = [];
        for (let i = 0; i <= roundedMax; i += 500) {
            ticks.push(i);
        }
        return ticks;
    };

    const generateOrderTicks = () => {
        if (maxOrders === 0) return [0, 1, 2, 3, 4, 5];
        
        const roundedMax = Math.ceil(maxOrders);
        const ticks = [];
        for (let i = 0; i <= roundedMax; i++) {
            ticks.push(i);
        }
        return ticks;
    };

    const revenueTicks = generateRevenueTicks();
    const orderTicks = generateOrderTicks();

    const handleDateFilter = (e) => {
        e.preventDefault();
        router.get('/admin/reports', {
            start_date: data.start_date,
            end_date: data.end_date,
        }, {
            preserveState: true,
            only: ['salesData', 'expensesData', 'salesRecordsData', 'topItems', 'stockAlerts', 'totals', 'startDate', 'endDate']
        });
    };

    const resetFilters = () => {
        router.get('/admin/reports', {}, {
            preserveState: true,
            only: ['salesData', 'expensesData', 'salesRecordsData', 'topItems', 'stockAlerts', 'totals', 'startDate', 'endDate']
        });
    };

    const generatePDF = () => {
        alert('PDF generation would be implemented here. For now, use browser print (Ctrl+P).');
    };

    // Calculate metrics
    const metrics = [
        {
            title: "Total Revenue",
            value: formatPeso(totals?.revenue || 0),
            change: `${totals?.orders || 0} Orders`,
            icon: "💰",
            color: "from-yellow-400 to-yellow-600",
            textColor: "text-yellow-700",
            bgColor: "bg-yellow-50",
            borderColor: "border-yellow-200"
        },
        {
            title: "Total Expenses",
            value: formatPeso(totals?.expenses || 0),
            change: `${expensesData.length} expense days`,
            icon: "📉",
            color: "from-purple-400 to-purple-600",
            textColor: "text-purple-700",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200"
        },
        {
            title: "Net Profit",
            value: formatPeso(totals?.netProfit || 0),
            change: `${(totals?.profitMargin || 0).toFixed(1)}% margin`,
            icon: "📊",
            color: "from-green-400 to-green-600",
            textColor: "text-green-700",
            bgColor: "bg-green-50",
            borderColor: "border-green-200"
        },
        {
            title: "Stock Alerts",
            value: stockAlerts.length,
            change: stockAlerts.length > 0 ? 'Needs Attention' : 'All Good',
            icon: "⚠️",
            color: "from-red-400 to-red-600",
            textColor: "text-red-700",
            bgColor: "bg-red-50",
            borderColor: "border-red-200"
        }
    ];

    return (
        <AdminLayout auth={auth}>
            <Head title="Reports & Analytics" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                        <p className="text-gray-600">Business performance insights and analytics</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
                        >
                            <span className="mr-2">🖨️</span> Print
                        </button>
                        <button
                            onClick={generatePDF}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center"
                        >
                            <span className="mr-2">📄</span> Export PDF
                        </button>
                    </div>
                </div>

                {/* Date Filter - FIXED: Added id, name, and proper labels */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center mb-4">
                        <span className="mr-2">📅</span>
                        <h3 className="text-lg font-semibold">Report Filters</h3>
                    </div>
                    <form onSubmit={handleDateFilter} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    id="start_date"
                                    name="start_date"
                                    value={data.start_date}
                                    onChange={e => setData('start_date', e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    id="end_date"
                                    name="end_date"
                                    value={data.end_date}
                                    onChange={e => setData('end_date', e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                    required
                                />
                            </div>
                            <div className="flex items-end space-x-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex-1"
                                >
                                    Generate Report
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((metric, index) => (
                        <div key={index} className={`bg-white rounded-xl shadow-sm border ${metric.borderColor} p-6`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                                    <div className={`inline-flex items-center mt-2 text-sm ${metric.textColor}`}>
                                        <span>{metric.icon}</span>
                                        <span className="ml-1">{metric.change}</span>
                                    </div>
                                </div>
                                <div className={`p-3 rounded-lg bg-gradient-to-br ${metric.color} text-white`}>
                                    <span className="text-xl">{metric.icon}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts - FIXED: Chart dimension issues with explicit dimensions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue vs Expenses Chart */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center mb-4">
                            <span className="mr-2">📈</span>
                            <h3 className="text-lg font-semibold">Revenue vs Expenses</h3>
                        </div>
                        {/* FIXED: Explicit dimensions instead of percentage */}
                        <div className="w-full" style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={profitChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis 
                                        tickFormatter={(value) => `₱${value}`}
                                        domain={[0, 'auto']}
                                        ticks={revenueTicks}
                                    />
                                    <Tooltip 
                                        formatter={(value, name) => {
                                            const label = name === 'revenue' ? 'Revenue' : 'Expenses';
                                            return [`₱${parseFloat(value).toLocaleString()}`, label];
                                        }}
                                        labelFormatter={(label) => `Date: ${label}`}
                                    />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#D5A724" name="Revenue" />
                                    <Bar dataKey="expenses" fill="#9b59b6" name="Expenses" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Orders Chart */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center mb-4">
                            <span className="mr-2">📊</span>
                            <h3 className="text-lg font-semibold">Order Volume</h3>
                        </div>
                        {/* FIXED: Explicit dimensions instead of percentage */}
                        <div className="w-full" style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={ordersChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis 
                                        domain={[0, 'auto']}
                                        ticks={orderTicks}
                                    />
                                    <Tooltip 
                                        formatter={(value) => [`${value} orders`, 'Orders']}
                                        labelFormatter={(label) => `Date: ${label}`}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="orders" 
                                        stroke="#3498db" 
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                        name="Orders"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Sales Records Table */}
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="mr-2">🧾</span>
                                <h3 className="text-lg font-semibold">Sales Records</h3>
                            </div>
                            <span className="text-sm text-gray-500">
                                {startDate} to {endDate}
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Total Sales</p>
                                <p className="text-xl font-bold">{totals?.salesRecordsCount || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-xl font-bold text-green-600">
                                    {formatPeso(totals?.salesRecordsTotal || 0)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Average Sale</p>
                                <p className="text-xl font-bold">{formatPeso(totals?.avgSaleAmount || 0)}</p>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 border-b">
                                        <th className="pb-3 font-medium">Invoice #</th>
                                        <th className="pb-3 font-medium">Date & Time</th>
                                        <th className="pb-3 font-medium">Customer</th>
                                        <th className="pb-3 font-medium">Subtotal</th>
                                        <th className="pb-3 font-medium">Tax</th>
                                        <th className="pb-3 font-medium">Discount</th>
                                        <th className="pb-3 font-medium">Total</th>
                                        <th className="pb-3 font-medium">Payment</th>
                                        <th className="pb-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesRecordsData.length > 0 ? (
                                        salesRecordsData.map((record, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="py-3">
                                                    <span className="font-medium">{record.invoice_number}</span>
                                                </td>
                                                <td className="py-3">
                                                    <div>
                                                        <div className="text-sm">{record.sale_date}</div>
                                                        <div className="text-xs text-gray-500">{record.sale_time}</div>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    {record.customer_name || 'Walk-in Customer'}
                                                </td>
                                                <td className="py-3">{formatPeso(record.total_amount)}</td>
                                                <td className="py-3">{formatPeso(record.tax_amount)}</td>
                                                <td className="py-3">{formatPeso(record.discount_amount)}</td>
                                                <td className="py-3">
                                                    <span className="font-bold text-green-600">
                                                        {formatPeso(record.final_amount)}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                        {record.payment_method || 'Cash'}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="py-8 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-3xl mb-3">📊</span>
                                                    <p>No sales records found for selected period</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Top Selling Items */}
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="mr-2">⭐</span>
                                <h3 className="text-lg font-semibold">Top Selling Items</h3>
                            </div>
                            <span className="text-sm text-gray-500">
                                {startDate} to {endDate}
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        {topItems.length > 0 ? (
                            <>
                                <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Items Sold</p>
                                        <p className="text-xl font-bold">
                                            {topItems.reduce((sum, item) => sum + parseInt(item.total_quantity), 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Revenue</p>
                                        <p className="text-xl font-bold text-green-600">
                                            {formatPeso(topItems.reduce((sum, item) => sum + parseFloat(item.total_revenue), 0))}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Items Displayed</p>
                                        <p className="text-xl font-bold">{topItems.length}</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-sm text-gray-500 border-b">
                                                <th className="pb-3 font-medium">Rank</th>
                                                <th className="pb-3 font-medium">Item Details</th>
                                                <th className="pb-3 font-medium">Quantity Sold</th>
                                                <th className="pb-3 font-medium">Total Revenue</th>
                                                <th className="pb-3 font-medium">Avg. Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topItems.map((item, index) => (
                                                <tr key={item.id || index} className="border-b hover:bg-gray-50">
                                                    <td className="py-3">
                                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                                                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                            index === 1 ? 'bg-gray-100 text-gray-800' :
                                                            index === 2 ? 'bg-amber-100 text-amber-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            #{index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div>
                                                            <p className="font-medium">{item.name}</p>
                                                            <p className="text-sm text-gray-500">ID: #{item.id.toString().padStart(4, '0')}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div>
                                                            <span className="font-medium">{item.total_quantity}</span>
                                                            <span className="text-sm text-gray-500 ml-1">units</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="font-bold text-green-600">
                                                            {formatPeso(item.total_revenue)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="text-gray-700">
                                                            {formatPeso(item.avg_price)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <span className="text-3xl mb-3">🍽️</span>
                                <p>No sales data available for selected period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stock Alerts */}
                {stockAlerts.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-red-100">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-2 text-red-500">⚠️</span>
                                    <h3 className="text-lg font-semibold text-red-700">Stock Alerts</h3>
                                </div>
                                <span className="text-sm text-red-600">
                                    {stockAlerts.length} items need attention
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-sm text-gray-500 border-b">
                                            <th className="pb-3 font-medium">Ingredient</th>
                                            <th className="pb-3 font-medium">Current Stock</th>
                                            <th className="pb-3 font-medium">Minimum Required</th>
                                            <th className="pb-3 font-medium">Unit</th>
                                            <th className="pb-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockAlerts.map((alert, index) => (
                                            <tr key={index} className="border-b hover:bg-red-50">
                                                <td className="py-3">
                                                    <strong>{alert.name}</strong>
                                                </td>
                                                <td className={`py-3 ${parseFloat(alert.quantity) <= 0 ? 'text-red-600 font-bold' : ''}`}>
                                                    {alert.quantity}
                                                </td>
                                                <td className="py-3">{alert.min_stock}</td>
                                                <td className="py-3">{alert.unit}</td>
                                                <td className="py-3">
                                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                                        Low Stock
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}