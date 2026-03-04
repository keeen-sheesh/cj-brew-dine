import React, { useState, useEffect } from 'react';
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

// Role icons and colors
const roleConfig = {
    admin: {
        icon: Crown,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        label: 'Admin'
    },
    resto_admin: {
        icon: Building2,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        label: 'Resto Admin'
    },
    resto: {
        icon: Coffee,
        color: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        label: 'Resto Staff'
    },
    kitchen: {
        icon: ChefHat,
        color: 'from-amber-500 to-amber-600',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        label: 'Kitchen Staff'
    },
    customer: {
        icon: UserCircle,
        color: 'from-gray-500 to-gray-600',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        label: 'Customer'
    }
};

// Status badge mapping
const getStatusBadge = (status) => {
    const statusMap = {
        'completed': { 
            bg: 'bg-emerald-50', 
            text: 'text-emerald-700', 
            border: 'border-emerald-200',
            dot: 'bg-emerald-500',
            icon: CheckCircle,
            label: 'Completed' 
        },
        'pending': { 
            bg: 'bg-amber-50', 
            text: 'text-amber-700', 
            border: 'border-amber-200',
            dot: 'bg-amber-500',
            icon: Clock,
            label: 'Pending' 
        },
        'preparing': { 
            bg: 'bg-blue-50', 
            text: 'text-blue-700', 
            border: 'border-blue-200',
            dot: 'bg-blue-500',
            icon: Coffee,
            label: 'Preparing' 
        },
        'ready': { 
            bg: 'bg-purple-50', 
            text: 'text-purple-700', 
            border: 'border-purple-200',
            dot: 'bg-purple-500',
            icon: CheckCircle,
            label: 'Ready' 
        },
        'cancelled': { 
            bg: 'bg-rose-50', 
            text: 'text-rose-700', 
            border: 'border-rose-200',
            dot: 'bg-rose-500',
            icon: XCircle,
            label: 'Cancelled' 
        },
    };
    return statusMap[status] || { 
        bg: 'bg-gray-50', 
        text: 'text-gray-700', 
        border: 'border-gray-200',
        dot: 'bg-gray-500',
        icon: Clock,
        label: status 
    };
};

// Order type icon and color
const getOrderTypeInfo = (type) => {
    const types = {
        'dine_in': { icon: Home, bg: 'bg-blue-50', text: 'text-blue-700', label: 'Dine In' },
        'takeout': { icon: Package, bg: 'bg-amber-50', text: 'text-amber-700', label: 'Takeout' },
        'delivery': { icon: Truck, bg: 'bg-purple-50', text: 'text-purple-700', label: 'Delivery' },
    };
    return types[type] || { icon: ShoppingBag, bg: 'bg-gray-50', text: 'text-gray-700', label: type };
};

// View All Transactions Modal
const ViewAllModal = ({ isOpen, onClose, allTransactions = [], onViewDetails }) => {
    const [localFilter, setLocalFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Filter transactions locally
    const filteredTransactions = allTransactions.filter(transaction => {
        // Status filter
        const matchesStatus = localFilter === 'all' || transaction.status === localFilter;
        
        // Search filter
        const matchesSearch = searchQuery === '' || 
            transaction.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            transaction.id?.toString().includes(searchQuery);
        
        return matchesStatus && matchesSearch;
    });

    // Pagination
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [localFilter, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <ShoppingBag className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">All Transactions</h2>
                                <p className="text-white/80 text-sm mt-1">
                                    View and manage all orders
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Status Filter */}
                        <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
                            {['all', 'completed', 'pending', 'preparing', 'ready'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setLocalFilter(filter)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                                        localFilter === filter
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by customer name or order number..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Results count */}
                        <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                            <span className="text-sm font-medium">
                                {filteredTransactions.length} results
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Order</th>
                                <th className="px-6 py-4">Customer / Cashier</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentTransactions.length > 0 ? (
                                currentTransactions.map((transaction) => {
                                    const status = getStatusBadge(transaction.status);
                                    const StatusIcon = status.icon;
                                    const OrderTypeIcon = getOrderTypeInfo(transaction.order_type).icon;
                                    const cashierConfig = roleConfig[transaction.cashier_role || 'resto'];
                                    const CashierIcon = cashierConfig.icon;
                                    
                                    return (
                                        <tr 
                                            key={transaction.id} 
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => {
                                                onViewDetails(transaction.id);
                                                onClose();
                                            }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${getOrderTypeInfo(transaction.order_type).bg}`}>
                                                        <OrderTypeIcon className={`w-3 h-3 ${getOrderTypeInfo(transaction.order_type).text}`} />
                                                    </div>
                                                    <span className="font-mono font-medium text-gray-900">
                                                        {transaction.order_number}
                                                    </span>
                                                    {transaction.is_hotel && (
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                            Hotel
                                                        </span>
                                                    )}
                                                    {transaction.is_personal && (
                                                        <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">
                                                            Personal
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    {/* Customer */}
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3 h-3 text-gray-400" />
                                                        <span className="text-sm text-gray-900">{transaction.customer_name}</span>
                                                    </div>
                                                    {/* Cashier */}
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1 rounded ${cashierConfig.bgColor}`}>
                                                            <CashierIcon className={`w-3 h-3 ${cashierConfig.textColor}`} />
                                                        </div>
                                                        <span className={`text-xs font-medium ${cashierConfig.textColor}`}>
                                                            {transaction.cashier_name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    {transaction.room_number && (
                                                        <div className="text-xs text-gray-500">Room #{transaction.room_number}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {transaction.items_count} items
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">
                                                    {formatPeso(transaction.total_amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(transaction.created_at).toLocaleTimeString('en-PH', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="p-1 hover:bg-gray-100 rounded-lg">
                                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-gray-500 font-medium">No transactions found</p>
                                            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-medium text-gray-700">{indexOfFirstItem + 1}</span> to{' '}
                            <span className="font-medium text-gray-700">{Math.min(indexOfLastItem, filteredTransactions.length)}</span>{' '}
                            of <span className="font-medium text-gray-700">{filteredTransactions.length}</span> entries
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-1 bg-blue-600 text-white rounded-lg font-medium">
                                {currentPage}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Dashboard({ 
    auth, 
    stats, 
    recentSales, 
    weeklyData, 
    topItems,
    paymentMethodBreakdown,
    orderTypeBreakdown,
    filters,
    allTransactions = [] // Add this prop for all transactions
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
