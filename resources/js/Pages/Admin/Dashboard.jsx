import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Calendar,
    ChevronDown,
    RefreshCw,
    Eye,
    ShoppingBag,
    Package,
    DollarSign,
    AlertCircle,
    CheckCircle,
    XCircle,
    ArrowRight,
} from 'lucide-react';

// Format currency in Philippine Peso
const formatPeso = (amount) => {
    if (amount === null || amount === undefined) return '₱0.00';
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Format number with commas
const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function Dashboard({ 
    auth, 
    stats, 
    recentSales, 
    weeklyData, 
    topItems,
    paymentMethodBreakdown,
    orderTypeBreakdown,
    filters 
}) {
    const [dateRange, setDateRange] = useState(filters?.range || 'today');
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);
    const [currentPage, setCurrentPage] = useState(recentSales?.current_page || 1);
    
    // Date range options
    const dateRangeOptions = [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'this_week', label: 'This Week' },
        { value: 'last_week', label: 'Last Week' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
    ];
    
    const selectedRangeLabel = dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Today';
    
    // Handle date range change
    const handleDateRangeChange = (range) => {
        setDateRange(range);
        setShowDateDropdown(false);
        router.get('/admin/dashboard', { 
            range, 
            page: 1,
        }, { 
            preserveState: true 
        });
    };
    
    // Handle refresh
    const handleRefresh = () => {
        router.get('/admin/dashboard', { 
            range: dateRange,
            page: currentPage,
        }, { 
            preserveState: true 
        });
    };
    
    // Fetch transaction details
    const fetchTransactionDetails = async (orderId) => {
        setIsLoadingTransaction(true);
        try {
            const response = await fetch(`/admin/transactions/${orderId}`);
            const data = await response.json();
            setSelectedTransaction(data);
        } catch (error) {
            console.error('Failed to fetch transaction:', error);
        } finally {
            setIsLoadingTransaction(false);
        }
    };
    
    // Go to page
    const goToPage = (page) => {
        setCurrentPage(page);
        router.get('/admin/dashboard', { 
            range: dateRange,
            page,
        }, { 
            preserveState: true 
        });
    };
    
    // Get status badge
    const getStatusBadge = (status) => {
        const statusMap = {
            'completed': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle },
            'pending': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: AlertCircle },
            'preparing': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: ShoppingBag },
            'cancelled': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: XCircle },
        };
        return statusMap[status] || statusMap['pending'];
    };

    return (
        <AdminLayout auth={auth}>
            <Head title="Dashboard" />
            
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>
            
            {/* Date Range Selector */}
            <div className="mb-6 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
                <div className="relative">
                    <button
                        onClick={() => setShowDateDropdown(!showDateDropdown)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700">{selectedRangeLabel}</span>
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {showDateDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                            {dateRangeOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => handleDateRangeChange(option.value)}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                                        dateRange === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Sales */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Sales</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatPeso(stats?.totalSales)}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
                
                {/* Total Orders */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatNumber(stats?.totalOrders)}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                
                {/* Completed Orders */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatNumber(stats?.completedOrders)}</p>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
                
                {/* Pending Orders */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{formatNumber(stats?.pendingOrders)}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Average Order Value */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Average Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPeso(stats?.averageOrderValue)}</p>
                </div>
                
                {/* Low Stock Items */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Low Stock Items</p>
                    <p className="text-2xl font-bold text-yellow-600">{formatNumber(stats?.lowStockItems)}</p>
                </div>
                
                {/* Out of Stock */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">{formatNumber(stats?.outOfStockItems)}</p>
                </div>
            </div>
            
            {/* Recent Sales Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
                    <Link
                        href="/admin/transactions"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left font-semibold text-gray-700 py-3">Order #</th>
                                <th className="text-left font-semibold text-gray-700 py-3">Customer</th>
                                <th className="text-left font-semibold text-gray-700 py-3">Amount</th>
                                <th className="text-left font-semibold text-gray-700 py-3">Status</th>
                                <th className="text-left font-semibold text-gray-700 py-3">Time</th>
                                <th className="text-left font-semibold text-gray-700 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentSales?.data && recentSales.data.length > 0 ? (
                                recentSales.data.map((sale) => {
                                    const statusBadge = getStatusBadge(sale.status);
                                    const StatusIcon = statusBadge.icon;
                                    return (
                                        <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4">#{sale.order_number}</td>
                                            <td className="py-4 text-gray-700">{sale.customer_name}</td>
                                            <td className="py-4 font-medium">{formatPeso(sale.total_amount)}</td>
                                            <td className="py-4">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="py-4 text-gray-600 text-xs">
                                                {new Date(sale.created_at).toLocaleString()}
                                            </td>
                                            <td className="py-4">
                                                <button
                                                    onClick={() => fetchTransactionDetails(sale.id)}
                                                    className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">No sales data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {recentSales?.last_page > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-gray-600">
                            Showing {recentSales?.from} to {recentSales?.to} of {recentSales?.total} results
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            
                            {Array.from({ length: recentSales?.last_page }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === recentSales?.last_page}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Top Selling Items */}
            {topItems && topItems.length > 0 && (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Selling Items</h2>
                    <div className="space-y-4">
                        {topItems.map((item, index) => (
                            <div key={item.item_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg font-bold text-blue-600">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{item.item_name}</p>
                                        <p className="text-sm text-gray-600">{item.category_name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">{formatNumber(item.quantity)} sold</p>
                                    <p className="text-sm text-gray-600">{formatPeso(item.revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
