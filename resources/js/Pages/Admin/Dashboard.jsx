import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardModals from '@/Components/DashboardModals';
import Modal from '@/Components/Modal';
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    ChevronDown,
    RefreshCw,
    Bell,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    ShoppingBag,
    Clock,
    Package,
    DollarSign,
    Users,
    CreditCard,
    Home,
    Truck,
    Coffee,
    AlertCircle,
    CheckCircle,
    XCircle,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react';

// Format currency in Philippine Peso - FIXED: removed extra ₱
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
    topItemsWeek,
    paymentMethodBreakdown,
    orderTypeBreakdown,
    filters 
}) {
    const [activeModal, setActiveModal] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [dateRange, setDateRange] = useState(filters?.range || 'today');
    const [customDateFrom, setCustomDateFrom] = useState(filters?.from || '');
    const [customDateTo, setCustomDateTo] = useState(filters?.to || '');
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [transactionFilter, setTransactionFilter] = useState(filters?.filter || 'all');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);
    const [selectedChartView, setSelectedChartView] = useState('revenue');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(recentSales.current_page || 1);
    
    const unreadCount = 0; // Removed notifications
    
    // Date range options
    const dateRangeOptions = [
        { value: 'today', label: 'Today', icon: Calendar },
        { value: 'yesterday', label: 'Yesterday', icon: Calendar },
        { value: 'this_week', label: 'This Week', icon: Calendar },
        { value: 'last_week', label: 'Last Week', icon: Calendar },
        { value: 'this_month', label: 'This Month', icon: Calendar },
        { value: 'last_month', label: 'Last Month', icon: Calendar },
        { value: 'custom', label: 'Custom Range', icon: Calendar },
    ];
    
    const selectedRangeLabel = dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Today';
    
    // Handle date range change
    const handleDateRangeChange = (range) => {
        setDateRange(range);
        setShowDateDropdown(false);
        
        if (range === 'custom') {
            setShowCustomDatePicker(true);
        } else {
            router.get('/admin/dashboard', { 
                range, 
                page: 1,
                filter: transactionFilter 
            }, { 
                preserveState: true 
            });
        }
    };
    
    // Apply custom date range
    const applyCustomDateRange = () => {
        if (customDateFrom && customDateTo) {
            setShowCustomDatePicker(false);
            router.get('/admin/dashboard', { 
                range: 'custom',
                from: customDateFrom,
                to: customDateTo,
                page: 1,
                filter: transactionFilter 
            }, { 
                preserveState: true 
            });
        }
    };
    
    // Handle modal actions
    const handleModalAction = (action, data) => {
        switch (action) {
            case 'view-order':
                fetchTransactionDetails(data);
                break;
            case 'view-item':
                setActiveModal('item-details');
                setModalData({ itemId: data, itemName: data });
                break;
            default:
                break;
        }
    };
    
    // Fetch transaction details
    const fetchTransactionDetails = async (orderId) => {
        setIsLoadingTransaction(true);
        try {
            const response = await fetch(`/admin/transactions/${orderId}`);
            const data = await response.json();
            setSelectedTransaction(data);
            setActiveModal('order-details');
        } catch (error) {
            console.error('Failed to fetch transaction:', error);
        } finally {
            setIsLoadingTransaction(false);
        }
    };
    
    // Handle refresh
    const handleRefresh = () => {
        router.reload({ only: ['stats', 'recentSales', 'topItems'] });
    };
    
    // Open modal with data
    const openModal = (modalName, data = null) => {
        setActiveModal(modalName);
        setModalData(data);
    };
    
    // Close modal
    const closeModal = () => {
        setActiveModal(null);
        setModalData(null);
        setSelectedTransaction(null);
    };
    
    // Handle page change
    const goToPage = (page) => {
        setCurrentPage(page);
        router.get('/admin/dashboard', { 
            page, 
            filter: transactionFilter,
            range: dateRange,
            from: customDateFrom,
            to: customDateTo,
            per_page: 10 
        }, { 
            preserveState: true,
            preserveScroll: true 
        });
    };
    
    // Handle filter change
    const handleFilterChange = (filter) => {
        setTransactionFilter(filter);
        setCurrentPage(1);
        router.get('/admin/dashboard', { 
            filter, 
            page: 1,
            range: dateRange,
            from: customDateFrom,
            to: customDateTo,
            per_page: 10 
        }, { 
            preserveState: true 
        });
    };
    
    // Handle view all
    const handleViewAll = () => {
        router.visit('/admin/transactions');
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
    
    // Order Details Modal
    const OrderDetailsModal = () => {
        if (!selectedTransaction) return null;
        
        const transaction = selectedTransaction;
        const statusBadge = getStatusBadge(transaction.status);
        const StatusIcon = statusBadge.icon;
        const OrderTypeIcon = getOrderTypeInfo(transaction.order_type).icon;
        
        return (
            <Modal isOpen={activeModal === 'order-details'} onClose={closeModal} title={`Order ${transaction.order_number}`} size="lg">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getOrderTypeInfo(transaction.order_type).bg}`}>
                                <OrderTypeIcon className={`w-5 h-5 ${getOrderTypeInfo(transaction.order_type).text}`} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Order Type</p>
                                <p className="font-medium text-gray-900">{getOrderTypeInfo(transaction.order_type).label}</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${statusBadge.bg} ${statusBadge.text}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{statusBadge.label}</span>
                        </div>
                    </div>
                    
                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Customer</p>
                            <p className="font-medium text-gray-900">{transaction.customer_name}</p>
                            {transaction.room_number && (
                                <p className="text-sm text-amber-600 mt-1">Room #{transaction.room_number}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                            <p className="font-medium text-gray-900">{transaction.created_at_formatted}</p>
                            {transaction.user && (
                                <p className="text-sm text-gray-500 mt-1">Cashier: {transaction.user}</p>
                            )}
                        </div>
                    </div>
                    
                    {/* Items */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h4>
                        <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
                            {transaction.items.map((item, index) => (
                                <div key={index} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.quantity} x {formatPeso(item.unit_price)}
                                            </p>
                                        </div>
                                        <p className="font-bold text-gray-900">{formatPeso(item.total_price)}</p>
                                    </div>
                                    {item.special_instructions && (
                                        <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                                            📝 {item.special_instructions}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Totals */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">{formatPeso(transaction.subtotal)}</span>
                        </div>
                        {transaction.discount_amount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Discount</span>
                                <span className="text-red-500 font-medium">-{formatPeso(transaction.discount_amount)}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-blue-600">{formatPeso(transaction.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <span>🖨️</span>
                            Print Receipt
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            Reorder
                        </button>
                    </div>
                </div>
            </Modal>
        );
    };
    
    // Item Details Modal
    const ItemDetailsModal = () => (
        <Modal isOpen={activeModal === 'item-details'} onClose={closeModal} title={modalData?.itemName || "Item Details"} size="md">
            <div className="space-y-6">
                {/* Item Header */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl">
                        🍕
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-gray-900">{modalData?.itemName || "Pepperoni Pizza"}</h3>
                        <p className="text-gray-500">Menu Item</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{formatPeso(15.99)}</p>
                    </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-600 mb-1">Today's Sales</p>
                        <p className="text-2xl font-bold text-emerald-700">124</p>
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            +12% vs yesterday
                        </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 mb-1">Revenue</p>
                        <p className="text-2xl font-bold text-blue-700">{formatPeso(1982.76)}</p>
                        <p className="text-xs text-blue-600 mt-1">Today</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <p className="text-xs text-purple-600 mb-1">This Week</p>
                        <p className="text-2xl font-bold text-purple-700">847</p>
                        <p className="text-xs text-purple-600 mt-1">sold</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                        <p className="text-xs text-amber-600 mb-1">This Month</p>
                        <p className="text-2xl font-bold text-amber-700">2,451</p>
                        <p className="text-xs text-amber-600 mt-1">sold</p>
                    </div>
                </div>
                
                {/* Quick Actions */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Update Price
                        </button>
                        <button className="p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-2">
                            <Package className="w-4 h-4" />
                            Edit Item
                        </button>
                        <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 transition-all flex items-center justify-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Sales Report
                        </button>
                        <button className="p-3 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Disable Item
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
    
    // Pagination Component
    const Pagination = () => {
        if (recentSales.last_page <= 1) return null;
        
        return (
            <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-700">{recentSales.from}</span> to{' '}
                    <span className="font-medium text-gray-700">{recentSales.to}</span> of{' '}
                    <span className="font-medium text-gray-700">{recentSales.total}</span> entries
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => goToPage(recentSales.current_page - 1)}
                        disabled={recentSales.current_page === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => goToPage(recentSales.current_page + 1)}
                        disabled={recentSales.current_page === recentSales.last_page}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    // Weekly Sales Chart
    const WeeklySalesChart = () => {
        if (!weeklyData || weeklyData.length === 0) return null;
        
        const maxSales = Math.max(...weeklyData.map(d => d.sales));
        
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
                            <p className="text-sm text-gray-500">Last 7 days</p>
                        </div>
                    </div>
                    
                    {/* Chart View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setSelectedChartView('revenue')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                selectedChartView === 'revenue'
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Revenue
                        </button>
                        <button
                            onClick={() => setSelectedChartView('orders')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                selectedChartView === 'orders'
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Orders
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 gap-4">
                    {weeklyData.map((day, index) => {
                        const value = selectedChartView === 'revenue' ? day.sales : (day.orders || 0);
                        const maxValue = selectedChartView === 'revenue' ? maxSales : Math.max(...weeklyData.map(d => d.orders || 0), 1);
                        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                        
                        return (
                            <div key={index} className="space-y-3">
                                <div className="text-center">
                                    <span className="text-sm font-medium text-gray-600">{day.day}</span>
                                </div>
                                
                                <div className="relative h-48 bg-gray-50 rounded-lg overflow-hidden group">
                                    <div 
                                        className={`absolute bottom-0 left-2 right-2 ${
                                            selectedChartView === 'revenue' 
                                                ? 'bg-gradient-to-t from-blue-500 to-blue-400' 
                                                : 'bg-gradient-to-t from-amber-500 to-amber-400'
                                        } rounded-t-lg transition-all duration-500 cursor-pointer`}
                                        style={{ height: `${percentage}%`, minHeight: '4px' }}
                                    >
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {selectedChartView === 'revenue' ? formatPeso(day.sales) : `${day.orders || 0} orders`}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-center">
                                    <div className="text-sm font-semibold text-gray-900">
                                        {selectedChartView === 'revenue' ? formatPeso(day.sales) : day.orders || 0}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <AdminLayout auth={auth}>
            <Head title="Dashboard" />
            
            {/* Modals */}
            <DashboardModals 
                activeModal={activeModal}
                onClose={closeModal}
                modalData={modalData}
                onAction={handleModalAction}
            />
            <OrderDetailsModal />
            <ItemDetailsModal />
            
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Welcome back, {auth.user.name}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Date Range Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDateDropdown(!showDateDropdown)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">{selectedRangeLabel}</span>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>
                            
                            {showDateDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 py-1">
                                    {dateRangeOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleDateRangeChange(option.value)}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                                dateRange === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                            }`}
                                        >
                                            <option.icon className="w-4 h-4" />
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Custom Date Picker */}
                        {showCustomDatePicker && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date Range</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                                            <input
                                                type="date"
                                                value={customDateFrom}
                                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                            <input
                                                type="date"
                                                value={customDateTo}
                                                onChange={(e) => setCustomDateTo(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                onClick={() => setShowCustomDatePicker(false)}
                                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={applyCustomDateRange}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Alerts */}
            {(stats.lowStockItems > 0 || stats.pendingOrders > 0) && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {stats.lowStockItems > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-lg">
                                <Package className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-amber-800">
                                    {stats.lowStockItems} {stats.lowStockItems === 1 ? 'item' : 'items'} low in stock
                                </p>
                                <p className="text-sm text-amber-600 mt-1">Restock soon to avoid running out</p>
                            </div>
                            <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">
                                View Inventory
                            </button>
                        </div>
                    )}
                    
                    {stats.pendingOrders > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-blue-800">
                                    {stats.pendingOrders} {stats.pendingOrders === 1 ? 'order' : 'orders'} pending
                                </p>
                                <p className="text-sm text-blue-600 mt-1">Requires attention in kitchen</p>
                            </div>
                            <button 
                                onClick={() => router.visit('/admin/kitchen')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                                View Kitchen
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Revenue Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            +12.5%
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{formatPeso(stats.totalSales)}</p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{stats.completedOrders} orders</span>
                        <span className="text-gray-900 font-medium">Avg {formatPeso(stats.averageOrderValue)}</span>
                    </div>
                </div>
                
                {/* Orders Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <ShoppingBag className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            +8.2%
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{stats.totalOrders}</p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Completed</span>
                        <span className="text-gray-900 font-medium">{stats.completedOrders}</span>
                    </div>
                </div>
                
                {/* Pending Orders Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            In Kitchen
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Pending Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{stats.pendingOrders}</p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Awaiting preparation</span>
                        <span className="text-amber-600 font-medium">{stats.pendingOrders} items</span>
                    </div>
                </div>
                
                {/* Stock Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        {stats.lowStockItems > 0 && (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                {stats.lowStockItems} low
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Low Stock Items</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{stats.lowStockItems}</p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Out of stock</span>
                        <span className="text-rose-600 font-medium">{stats.outOfStockItems || 0}</span>
                    </div>
                </div>
            </div>
            
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {/* Filter Dropdown */}
                                <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
                                    {['all', 'completed', 'pending'].map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => handleFilterChange(filter)}
                                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                                transactionFilter === filter
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                
                                <button
                                    onClick={handleViewAll}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    View All
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <th className="px-6 py-4">Order</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Items</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {recentSales.data && recentSales.data.length > 0 ? (
                                    recentSales.data.map((sale) => {
                                        const status = getStatusBadge(sale.status);
                                        const StatusIcon = status.icon;
                                        const OrderTypeIcon = getOrderTypeInfo(sale.order_type).icon;
                                        
                                        return (
                                            <tr 
                                                key={sale.id} 
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => fetchTransactionDetails(sale.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${getOrderTypeInfo(sale.order_type).bg}`}>
                                                            <OrderTypeIcon className={`w-3 h-3 ${getOrderTypeInfo(sale.order_type).text}`} />
                                                        </div>
                                                        <span className="font-mono font-medium text-gray-900">
                                                            {sale.order_number}
                                                        </span>
                                                        {sale.is_hotel && (
                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                                Hotel
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{sale.customer_name}</div>
                                                    {sale.room_number && (
                                                        <div className="text-xs text-gray-500">Room #{sale.room_number}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {sale.items_count} items
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900">
                                                        {formatPeso(sale.total_amount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {status.label}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(sale.created_at).toLocaleTimeString('en-PH', { 
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
                                                <p className="text-sm text-gray-400 mt-1">Transactions will appear here</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <Pagination />
                    </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                    {/* Top Items */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Top Items</h3>
                                    <p className="text-sm text-gray-500">{selectedRangeLabel}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4">
                            {topItems.length > 0 ? (
                                <div className="space-y-3">
                                    {topItems.map((item, index) => {
                                        const colors = [
                                            { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
                                            { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
                                            { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
                                            { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
                                            { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
                                        ];
                                        const color = colors[index % colors.length];
                                        
                                        return (
                                            <div 
                                                key={item.item_id} 
                                                className={`flex items-center justify-between p-4 ${color.bg} border ${color.border} rounded-xl hover:shadow-md cursor-pointer transition-all`}
                                                onClick={() => {
                                                    setModalData({ itemName: item.item_name });
                                                    setActiveModal('item-details');
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 ${color.bg} rounded-lg flex items-center justify-center font-bold ${color.text} border-2 ${color.border}`}>
                                                        #{index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{item.item_name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {item.quantity} sold
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{formatPeso(item.revenue)}</p>
                                                    <p className="text-xs text-gray-500">{formatPeso(item.price)} each</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No items sold</p>
                                    <p className="text-sm text-gray-400 mt-1">Items will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                        
                        <div className="space-y-4">
                            {/* Payment Methods */}
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Payment Methods</p>
                                <div className="space-y-2">
                                    {paymentMethodBreakdown && paymentMethodBreakdown.length > 0 ? (
                                        paymentMethodBreakdown.map((method, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{method.method || 'Unknown'}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-gray-900">{formatPeso(method.total)}</span>
                                                    <span className="text-xs text-gray-500">({method.order_count} orders)</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400">No payment data</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-sm text-gray-500 mb-2">Order Types</p>
                                <div className="space-y-2">
                                    {orderTypeBreakdown && orderTypeBreakdown.length > 0 ? (
                                        orderTypeBreakdown.map((type, index) => {
                                            const typeInfo = getOrderTypeInfo(type.order_type);
                                            const TypeIcon = typeInfo.icon;
                                            return (
                                                <div key={index} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1 rounded-lg ${typeInfo.bg}`}>
                                                            <TypeIcon className={`w-3 h-3 ${typeInfo.text}`} />
                                                        </div>
                                                        <span className="text-sm text-gray-600">{typeInfo.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-medium text-gray-900">{type.count} orders</span>
                                                        <span className="text-xs text-gray-500">{formatPeso(type.total)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-sm text-gray-400">No order type data</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Weekly Sales Chart */}
            <WeeklySalesChart />
            
            {/* Loading Overlay */}
            {isLoadingTransaction && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-3">Loading transaction...</p>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}