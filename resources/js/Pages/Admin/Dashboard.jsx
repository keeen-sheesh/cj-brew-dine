import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardModals from '@/Components/DashboardModals';
import Modal from '@/Components/Modal';

// Format currency in Philippine Peso
const formatPeso = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export default function Dashboard({ auth, stats, recentSales, weeklyData, topItems }) {
    const [activeModal, setActiveModal] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [dateRange, setDateRange] = useState('today');
    const [transactionFilter, setTransactionFilter] = useState('all');
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications] = useState([
        { id: 1, type: 'order', message: 'New order #1024 received', time: '5 min ago', read: false },
        { id: 2, type: 'inventory', message: 'Coca-Cola is running low (5 remaining)', time: '2 hours ago', read: false },
        { id: 3, type: 'payment', message: 'Payment for order #1023 completed', time: '3 hours ago', read: true },
        { id: 4, type: 'system', message: 'Daily backup completed successfully', time: '1 day ago', read: true },
    ]);
    
    // Calculate unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Handle modal actions
    const handleModalAction = (action, data) => {
        console.log('Modal action:', action, data);
        
        switch (action) {
            case 'mark-completed':
                alert(`Order #${data} marked as completed!`);
                break;
            case 'restock':
                alert(`Order placed for ${data}!`);
                break;
            case 'view-order':
                setActiveModal('order-details');
                setModalData({ orderId: data });
                break;
            case 'view-item':
                setActiveModal('item-details');
                setModalData({ itemId: data, itemName: data });
                break;
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
    };
    
    // Filter transactions
    const filteredTransactions = recentSales.filter(sale => {
        if (transactionFilter === 'all') return true;
        if (transactionFilter === 'completed') return true;
        return true;
    });
    
    // Notifications Dropdown Component
    const NotificationsDropdown = () => {
        if (!notificationsOpen) return null;
        
        return (
            <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}>
                <div className="absolute right-6 top-16 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <button 
                                onClick={() => {}}
                                className="text-sm text-yellow-600 hover:text-yellow-700"
                            >
                                Mark all as read
                            </button>
                        </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div 
                                    key={notification.id}
                                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex items-start">
                                        <div className={`p-2 rounded-full mr-3 ${
                                            notification.type === 'order' ? 'bg-green-100 text-green-600' :
                                            notification.type === 'inventory' ? 'bg-yellow-100 text-yellow-600' :
                                            notification.type === 'payment' ? 'bg-blue-100 text-blue-600' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {notification.type === 'order' && '🛒'}
                                            {notification.type === 'inventory' && '📦'}
                                            {notification.type === 'payment' && '💰'}
                                            {notification.type === 'system' && '⚙️'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900">{notification.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                        </div>
                                        {!notification.read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <div className="w-12 h-12 mx-auto mb-3 text-gray-300">🔔</div>
                                <p>No notifications</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-3 border-t text-center">
                        <button className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
                            View All Notifications
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    // Date picker modal
    const DatePickerModal = () => (
        <Modal isOpen={activeModal === 'date-picker'} onClose={closeModal} title="Select Date Range">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    {['today', 'yesterday', 'this-week', 'last-week', 'this-month', 'custom'].map((range) => (
                        <button
                            key={range}
                            onClick={() => {
                                setDateRange(range);
                                if (range === 'custom') {
                                    // Would show calendar picker
                                } else {
                                    closeModal();
                                    // In real app: router.get(`/admin/dashboard?range=${range}`)
                                }
                            }}
                            className={`p-3 rounded-lg border text-center ${
                                dateRange === range 
                                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
                                    : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {range.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>
                
                {dateRange === 'custom' && (
                    <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2 border rounded-lg"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2 border rounded-lg"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    closeModal();
                                    // Apply custom date range
                                }}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
    
    // Order Details Modal
    const OrderDetailsModal = () => (
        <Modal isOpen={activeModal === 'order-details'} onClose={closeModal} title={`Order #${modalData?.orderId || '000'}`} size="lg">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                        <div className="space-y-2">
                            <p><span className="text-gray-600">Name:</span> John Doe</p>
                            <p><span className="text-gray-600">Type:</span> Walk-in</p>
                            <p><span className="text-gray-600">Table:</span> #5</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                        <div className="space-y-2">
                            <p><span className="text-gray-600">Time:</span> 3:33 PM</p>
                            <p><span className="text-gray-600">Status:</span> 
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Completed
                                </span>
                            </p>
                            <p><span className="text-gray-600">Payment:</span> Cash</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="border rounded-lg overflow-hidden">
                        {[
                            { name: 'Caesar Salad', qty: 1, price: 19.98 },
                            { name: 'Pepperoni Pizza', qty: 1, price: 15.99 },
                            { name: 'Classic Burger', qty: 1, price: 10.00 },
                        ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                                </div>
                                <p className="font-medium">{formatPeso(item.price)}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-600">Subtotal</p>
                            <p className="text-2xl font-bold text-gray-900">{formatPeso(45.97)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Tax (12%)</p>
                            <p className="text-lg font-medium">{formatPeso(5.52)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-yellow-600">{formatPeso(51.49)}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Print Receipt
                    </button>
                    <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                        Reorder
                    </button>
                </div>
            </div>
        </Modal>
    );
    
    // Item Details Modal
    const ItemDetailsModal = () => (
        <Modal isOpen={activeModal === 'item-details'} onClose={closeModal} title={modalData?.itemName || "Item Details"}>
            <div className="space-y-4">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🍕</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{modalData?.itemName || "Pepperoni Pizza"}</h3>
                        <p className="text-gray-600">Italian • Pizza Category</p>
                        <p className="text-xl font-bold text-yellow-600">{formatPeso(15.99)}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Today's Sales</p>
                        <p className="text-lg font-bold">1 sold</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="text-lg font-bold">{formatPeso(15.99)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">This Week</p>
                        <p className="text-lg font-bold">3 sold</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">This Month</p>
                        <p className="text-lg font-bold">12 sold</p>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200">
                            Update Price
                        </button>
                        <button className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200">
                            Edit Item
                        </button>
                        <button className="p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200">
                            Sales Report
                        </button>
                        <button className="p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200">
                            Disable Item
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );

    return (
        <AdminLayout auth={auth}>
            <Head title="Dashboard" />
            
            {/* Dashboard Modals */}
            <DashboardModals 
                activeModal={activeModal}
                onClose={closeModal}
                modalData={modalData}
                onAction={handleModalAction}
            />
            
            {/* Other Modals */}
            <DatePickerModal />
            <OrderDetailsModal />
            <ItemDetailsModal />
            
            {/* Notifications Dropdown */}
            <NotificationsDropdown />
            
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back, {auth.user.name}!</p>
            </div>
            
            {/* Alerts */}
            <div className="mb-6 space-y-3">
                {stats.lowStockItems > 0 && (
                    <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="w-5 h-5 text-yellow-600 mr-3">⚠️</div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-800">
                                Low Stock Alert: {stats.lowStockItems} items need restocking.
                            </p>
                        </div>
                        <button 
                            onClick={() => openModal('inventory')}
                            className="text-sm font-medium text-yellow-700 hover:text-yellow-800"
                        >
                            View Inventory →
                        </button>
                    </div>
                )}
                
                {stats.pendingOrders > 0 && (
                    <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-5 h-5 text-blue-600 mr-3">⏰</div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">
                                Pending Orders: {stats.pendingOrders} orders require attention.
                            </p>
                        </div>
                        <button 
                            onClick={() => openModal('pending-orders')}
                            className="text-sm font-medium text-blue-700 hover:text-blue-800"
                        >
                            Go to Kitchen →
                        </button>
                    </div>
                )}
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Today's Revenue Card - Clickable */}
                <button 
                    onClick={() => openModal('revenue', { todaySales: stats.todaySales })}
                    className="bg-white rounded-xl shadow-sm border p-6 text-left hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Today's Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatPeso(stats.todaySales)}
                            </p>
                            <div className="inline-flex items-center mt-2 text-sm text-green-600">
                                <span>↑</span>
                                <span className="ml-1">Today</span>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
                            <span>📈</span>
                        </div>
                    </div>
                </button>
                
                {/* Today's Orders Card - Clickable */}
                <button 
                    onClick={() => alert('Today\'s Orders modal coming soon!')}
                    className="bg-white rounded-xl shadow-sm border p-6 text-left hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Today's Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.todayOrders}</p>
                            <div className="inline-flex items-center mt-2 text-sm text-green-600">
                                <span>↑</span>
                                <span className="ml-1">Total orders</span>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                            <span>🛒</span>
                        </div>
                    </div>
                </button>
                
                {/* Pending Orders Card - Clickable */}
                <button 
                    onClick={() => openModal('pending-orders', { pendingOrders: stats.pendingOrders })}
                    className="bg-white rounded-xl shadow-sm border p-6 text-left hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                            <div className={`inline-flex items-center mt-2 text-sm ${stats.pendingOrders > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                <span>{stats.pendingOrders > 0 ? '⚠️' : '✓'}</span>
                                <span className="ml-1">{stats.pendingOrders > 0 ? 'Needs attention' : 'All clear'}</span>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-red-400 to-red-600 text-white">
                            <span>⏰</span>
                        </div>
                    </div>
                </button>
                
                {/* Low Stock Items Card - Clickable */}
                <button 
                    onClick={() => openModal('inventory', { lowStockItems: stats.lowStockItems })}
                    className="bg-white rounded-xl shadow-sm border p-6 text-left hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Low Stock Items</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
                            <div className={`inline-flex items-center mt-2 text-sm ${stats.lowStockItems > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                <span>{stats.lowStockItems > 0 ? '⚠️' : '✓'}</span>
                                <span className="ml-1">{stats.lowStockItems > 0 ? 'Check inventory' : 'Stock good'}</span>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                            <span>📦</span>
                        </div>
                    </div>
                </button>
            </div>
            
            {/* Charts and Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="mr-2">📊</span>
                                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                            </div>
                            <div className="flex items-center space-x-4">
                                {/* Filter buttons */}
                                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                    {['all', 'completed', 'pending'].map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setTransactionFilter(filter)}
                                            className={`px-3 py-1 text-sm rounded-md ${
                                                transactionFilter === filter
                                                    ? 'bg-white shadow'
                                                    : 'hover:bg-gray-200'
                                            }`}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => alert('Full reports coming soon!')}
                                    className="text-sm font-medium text-yellow-600 hover:text-yellow-700"
                                >
                                    View All →
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 border-b">
                                        <th className="pb-3 font-medium">Order ID</th>
                                        <th className="pb-3 font-medium">Customer</th>
                                        <th className="pb-3 font-medium">Amount</th>
                                        <th className="pb-3 font-medium">Date</th>
                                        <th className="pb-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((sale) => (
                                            <tr 
                                                key={sale.id} 
                                                className="border-b hover:bg-gray-50 cursor-pointer"
                                                onClick={() => openModal('order-details', sale.id)}
                                            >
                                                <td className="py-3">
                                                    <span className="font-medium text-gray-900">#{sale.id}</span>
                                                </td>
                                                <td className="py-3">
                                                    {sale.customer_name || 'Walk-in Customer'}
                                                </td>
                                                <td className="py-3">
                                                    <span className="font-medium text-gray-900">
                                                        {formatPeso(sale.total_amount)}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-sm text-gray-600">
                                                    {new Date(sale.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="py-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Completed
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-3xl mb-3">🛒</span>
                                                    <p>No recent transactions</p>
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
                        <div className="flex items-center">
                                            <span className="mr-2">⭐</span>
                                            <h3 className="text-lg font-semibold text-gray-900">Top Items Today</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Best sellers</p>
                                    </div>
                                    <div className="p-6">
                                        <ul className="space-y-4">
                                            {topItems.length > 0 ? (
                                                topItems.map((item, index) => (
                                                    <li 
                                                        key={item.item_id || index} 
                                                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                                        onClick={() => openModal('item-details', item.item_name)}
                                                    >
                                                        <div className="flex items-center">
                                                            <button 
                                                                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg mr-3 hover:bg-gray-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    alert(`Item #${index + 1} highlighted!`);
                                                                }}
                                                            >
                                                                <span className="font-medium text-gray-700">#{index + 1}</span>
                                                            </button>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{item.item_name}</p>
                                                                <p className="text-sm text-gray-500">{item.quantity} sold</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium text-gray-900">
                                                                {formatPeso(item.revenue)}
                                                            </p>
                                                            <p className="text-sm text-gray-500">Revenue</p>
                                                        </div>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-center py-8 text-gray-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="text-3xl mb-3">🍽️</span>
                                                        <p>No sales today</p>
                                                    </div>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Top Navigation Buttons */}
                            <div className="fixed top-4 right-6 z-40 flex items-center space-x-4">
                                {/* Date Display - Clickable */}
                                <button 
                                    onClick={() => openModal('date-picker')}
                                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 px-3 py-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <span>📅</span>
                                    <span>{new Date().toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}</span>
                                </button>
                                
                                {/* Refresh Button */}
                                <button 
                                    onClick={handleRefresh}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
                                    title="Refresh dashboard"
                                >
                                    <span className="text-lg">↻</span>
                                </button>
                                
                                {/* Notifications Button */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                                        className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
                                    >
                                        <span className="text-lg">🔔</span>
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </AdminLayout>
                    );
                }