// resources/js/Pages/Admin/POS.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { 
    ShoppingCart, 
    Users, 
    CreditCard, 
    CheckCircle,
    Clock,
    Table as TableIcon,
    Truck,
    Package,
    Trash2,
    Plus,
    Minus,
    Search,
    AlertCircle,
    ChevronRight,
    X,
    Printer,
    ChefHat,
    ArrowLeft,
    Loader2,
    Receipt,
    DollarSign,
    Percent,
    Tag,
    Edit,
    MessageSquare,
    Phone,
    Check,
    Grid,
    List,
    Star,
    Zap,
    Coffee,
    Pizza,
    Salad,
    Soup,
    Sandwich,
    Milk,
    GlassWater,
    Wine,
    Drumstick,
    Utensils,
    Crown,
    Sparkles,
    Bell,
    RefreshCw,
    Eye,
    EyeOff,
    Ban,
    CheckSquare,
    Wifi,
    WifiOff
} from 'lucide-react';

// Category icons mapping
const categoryIcons = {
    'Main Dish': ChefHat,
    'Burgers & Sandwiches': Sandwich,
    'Pasta': Pizza,
    'Salad': Salad,
    'Appetizers': Utensils,
    'Coffee Based': Coffee,
    'Milk Based': Milk,
    'Frappe': Coffee,
    'Soda': GlassWater,
    'Add ons': Plus,
    'Soup': Soup,
    'Drinks': Wine,
    'Non Based Coffee': Coffee,
    'Specialty': Crown,
    'Seasonal': Star,
};

// Order type options
const ORDER_TYPES = [
    { value: 'takeout', label: 'Takeout', icon: Package, color: 'bg-emerald-500' },
    { value: 'delivery', label: 'Delivery', icon: Truck, color: 'bg-purple-500' },
    { value: 'dine_in', label: 'Dine In', icon: TableIcon, color: 'bg-blue-500' },
];

// Price formatting helper function
const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '0.00';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0.00';
    return numPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Product Availability Badge Component
const AvailabilityBadge = ({ isAvailable, stock }) => {
    if (!isAvailable) {
        return (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1">
                <Ban className="w-3 h-3" />
                Unavailable
            </span>
        );
    }
    
    if (stock !== null && stock <= 5) {
        return (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Low Stock: {stock}
            </span>
        );
    }
    
    return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
            <CheckSquare className="w-3 h-3" />
            Available
        </span>
    );
};

export default function POS({ 
    categories: initialCategories = [], 
    tables = [], 
    paymentMethods = [], 
    readyOrders = [], 
    pendingOrders: initialPendingOrders = [],
    appName = 'Restaurant POS',
    flash = {}
}) {
    const { auth } = usePage().props;
    
    // State management
    const [categories, setCategories] = useState(initialCategories);
    const [pendingOrders, setPendingOrders] = useState(initialPendingOrders);
    const [orderItems, setOrderItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [orderType, setOrderType] = useState('takeout');
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        address: '',
        notes: ''
    });
    const [peopleCount, setPeopleCount] = useState(1);
    const [cardsPresented, setCardsPresented] = useState(0);
    const [discount, setDiscount] = useState({ type: 'none', value: 0 });
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [processingOrder, setProcessingOrder] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedTable, setSelectedTable] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('connected');
    const [lastUpdate, setLastUpdate] = useState(new Date());
    
    // NEW STATE: Success order popup
    const [successOrder, setSuccessOrder] = useState(null);
    
    // Refs for scrollable areas
    const menuRef = useRef(null);
    const cartRef = useRef(null);

    // 🔥 REAL-TIME POLLING: Same as Kitchen.jsx (every 2 seconds)
    useEffect(() => {
        const pollInterval = setInterval(() => {
            checkForMenuUpdates();
            checkForOrderUpdates();
        }, 2000); // 2 seconds - matches kitchen polling
        
        return () => clearInterval(pollInterval);
    }, []);

    // Check for menu updates (availability, price changes, etc.)
    const checkForMenuUpdates = async () => {
        try {
            const response = await fetch('/admin/pos/menu-updates', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            if (!response.ok) throw new Error('Failed to fetch');
            
            const data = await response.json();
            
            if (data.success && data.updated_menu) {
                setCategories(data.updated_menu);
                setLastUpdate(new Date());
                
                // Check if any cart items are now unavailable
                const updatedItems = orderItems.map(cartItem => {
                    const menuItem = data.updated_menu
                        .flatMap(cat => cat.items || [])
                        .find(item => item.id === cartItem.id);
                    
                    if (menuItem && (menuItem.is_available === false || menuItem.stock === 0)) {
                        return { ...cartItem, is_available: false };
                    }
                    return cartItem;
                });
                
                const unavailableItems = updatedItems.filter(item => item.is_available === false);
                if (unavailableItems.length > 0) {
                    setOrderItems(updatedItems);
                    showNotification(`${unavailableItems.length} items are no longer available`, 'warning');
                }
            }
        } catch (error) {
            console.log('Menu polling error:', error);
            setConnectionStatus('disconnected');
        }
    };

    // Check for pending orders updates
    const checkForOrderUpdates = async () => {
        try {
            const response = await fetch('/admin/pos/order-updates', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            if (!response.ok) throw new Error('Failed to fetch');
            
            const data = await response.json();
            
            if (data.success && data.pending_orders) {
                setPendingOrders(data.pending_orders);
                setConnectionStatus('connected');
            }
        } catch (error) {
            console.log('Order polling error:', error);
        }
    };

    // Manual refresh function
    const refreshAllData = async () => {
        try {
            setIsLoading(true);
            const [menuResponse, ordersResponse] = await Promise.all([
                fetch('/admin/pos/menu-data'),
                fetch('/admin/pos/order-data')
            ]);
            
            const menuData = await menuResponse.json();
            const ordersData = await ordersResponse.json();
            
            if (menuData.categories) {
                setCategories(menuData.categories);
            }
            
            if (ordersData.pending_orders) {
                setPendingOrders(ordersData.pending_orders);
            }
            
            setLastUpdate(new Date());
            showNotification('Data refreshed successfully', 'success');
            
        } catch (error) {
            console.error('Failed to refresh data:', error);
            showNotification('Failed to refresh data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ FIXED DISCOUNT CALCULATION: total × 20% ÷ people × cards
    const calculateDiscount = () => {
        const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        
        // Card discount: total × 20% ÷ people × cards
        let cardDiscount = 0;
        if (cardsPresented > 0 && peopleCount > 0) {
            cardDiscount = (subtotal * 0.20) / peopleCount * cardsPresented;
            cardDiscount = Math.round(cardDiscount * 100) / 100;
        }
        
        // Additional discount
        let additionalDiscount = 0;
        if (discount.type === 'percentage' && discount.value > 0) {
            additionalDiscount = (subtotal * discount.value) / 100;
        } else if (discount.type === 'fixed' && discount.value > 0) {
            additionalDiscount = discount.value;
        }
        
        return {
            subtotal,
            cardDiscount,
            additionalDiscount,
            totalDiscount: cardDiscount + additionalDiscount,
            total: subtotal - (cardDiscount + additionalDiscount)
        };
    };

    const { subtotal, cardDiscount, additionalDiscount, totalDiscount, total } = calculateDiscount();

    // Filter items based on availability and search
    const filterItems = (items) => {
        let filtered = items;
        
        // Filter by availability if enabled
        if (showOnlyAvailable) {
            filtered = filtered.filter(item => item.is_available !== false);
        }
        
        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query)
            );
        }
        
        return filtered;
    };

    const filteredItems = activeCategory === 'all' 
        ? filterItems(categories.flatMap(cat => cat.items || []))
        : filterItems(categories.find(cat => cat.id.toString() === activeCategory)?.items || []);

    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, timestamp: new Date() });
        setTimeout(() => setNotification(null), 4000);
    };

    // Show success order popup
    const showSuccessOrder = (orderData) => {
        setSuccessOrder(orderData);
        setTimeout(() => setSuccessOrder(null), 5000);
    };

    // Reset order function
    const resetOrder = () => {
        setOrderItems([]);
        setCustomerInfo({ name: '', phone: '', address: '', notes: '' });
        setPeopleCount(1);
        setCardsPresented(0);
        setDiscount({ type: 'none', value: 0 });
        setSelectedTable(null);
        showNotification('Order has been reset', 'info');
    };

    // Add item to order with availability check
    const addToOrder = (item) => {
        if (item.is_available === false) {
            showNotification(`${item.name} is currently unavailable`, 'error');
            return;
        }
        
        if (item.stock !== null && item.stock <= 0) {
            showNotification(`${item.name} is out of stock`, 'error');
            return;
        }
        
        const existingItemIndex = orderItems.findIndex(
            orderItem => orderItem.id === item.id
        );
        
        if (existingItemIndex >= 0) {
            const updatedItems = [...orderItems];
            updatedItems[existingItemIndex].quantity += 1;
            setOrderItems(updatedItems);
        } else {
            const newItem = {
                id: item.id,
                name: item.name,
                price: Number(item.price),
                quantity: 1,
                is_available: item.is_available,
                stock: item.stock
            };
            setOrderItems([...orderItems, newItem]);
        }
        
        showNotification(`${item.name} added to order`, 'success');
    };

    // Update item quantity with stock check
    const updateQuantity = (index, change) => {
        const updatedItems = [...orderItems];
        const item = updatedItems[index];
        const newQuantity = item.quantity + change;
        
        if (newQuantity < 1) {
            removeItem(index);
            return;
        }
        
        // Check stock limit
        if (item.stock !== null && newQuantity > item.stock) {
            showNotification(`Only ${item.stock} items available in stock`, 'warning');
            return;
        }
        
        updatedItems[index].quantity = newQuantity;
        setOrderItems(updatedItems);
    };

    // Remove item from order
    const removeItem = (index) => {
        const itemName = orderItems[index].name;
        const updatedItems = orderItems.filter((_, i) => i !== index);
        setOrderItems(updatedItems);
        showNotification(`${itemName} removed from order`, 'info');
    };

    // Clear entire order
    const clearOrder = () => {
        if (orderItems.length > 0 && window.confirm('Clear the entire order?')) {
            resetOrder();
        }
    };

    // ✅ FIXED: Place order with success popup and reset
    const placeOrder = async () => {
        if (orderItems.length === 0) {
            showNotification('Please add items to the order first', 'error');
            return;
        }

        // Check for unavailable items
        const unavailableItems = orderItems.filter(item => item.is_available === false);
        if (unavailableItems.length > 0) {
            showNotification(`${unavailableItems.length} items are no longer available. Please remove them.`, 'error');
            return;
        }

        setIsLoading(true);

        try {
            const response = await router.post('/admin/pos/orders', {
                items: orderItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: Number(item.price),
                    quantity: item.quantity
                })),
                order_type: orderType,
                table_id: selectedTable,
                customer_name: customerInfo.name,
                customer_phone: customerInfo.phone,
                customer_address: customerInfo.address,
                notes: customerInfo.notes,
                people_count: peopleCount,
                cards_presented: cardsPresented,
                discount_type: discount.type,
                discount_value: discount.value
            });

            // ✅ FIXED: Show success popup with order details
            const successData = {
                orderId: response?.props?.order?.id || `#${Math.floor(Math.random() * 1000)}`,
                total: total,
                itemsCount: orderItems.length,
                customerName: customerInfo.name || 'Walk-in Customer',
                orderType: orderType
            };
            
            // Show success popup
            showSuccessOrder(successData);
            
            // ✅ FIXED: Reset the order after successful placement
            resetOrder();
            
            // Update pending orders list
            checkForOrderUpdates();

        } catch (error) {
            console.error('Order placement error:', error);
            showNotification('Error placing order. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Mark order as paid
    const markAsPaid = async (orderId) => {
        if (window.confirm('Mark this order as paid?')) {
            setProcessingOrder(orderId);
            try {
                await router.post(`/admin/orders/${orderId}/pay`, {
                    payment_method_id: 1
                });
                
                // Remove from pending orders immediately
                setPendingOrders(prev => prev.filter(order => order.id !== orderId));
                showNotification(`Order #${orderId} marked as paid`, 'success');
                
            } catch (error) {
                showNotification('Error processing payment', 'error');
                console.error('Payment error:', error);
            } finally {
                setProcessingOrder(null);
            }
        }
    };

    // Handle back button
    const handleBack = () => {
        const userRole = auth.user?.role;
        const roleRoutes = {
            'admin': '/admin/dashboard',
            'resto': '/cashier/pos',
            'resto_admin': '/cashier/dashboard',
            'kitchen': '/kitchen',
            'customer': '/menu'
        };
        
        const redirectTo = roleRoutes[userRole] || '/';
        router.visit(redirectTo);
    };

    // Connection status badge
    const ConnectionStatusBadge = () => {
        const getStatusInfo = () => {
            switch(connectionStatus) {
                case 'connected':
                    return { text: 'Live', icon: Wifi, color: 'bg-emerald-500', textColor: 'text-emerald-500' };
                case 'disconnected':
                    return { text: 'Offline', icon: WifiOff, color: 'bg-red-500', textColor: 'text-red-500' };
                default:
                    return { text: 'Connected', icon: Wifi, color: 'bg-emerald-500', textColor: 'text-emerald-500' };
            }
        };

        const status = getStatusInfo();
        const Icon = status.icon;

        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100">
                    <Icon className={`w-3 h-3 ${status.textColor}`} />
                    <span className={`text-xs font-medium ${status.textColor}`}>
                        {status.text}
                    </span>
                </div>
                <span className="text-xs text-gray-500">
                    Updated: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        );
    };

    // Success Order Popup Component
    const SuccessOrderPopup = () => {
        if (!successOrder) return null;

        return (
            <div className="fixed top-4 right-4 z-50 animate-slide-in">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl shadow-xl p-4 max-w-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">Order Placed Successfully!</h3>
                                <button 
                                    onClick={() => setSuccessOrder(null)}
                                    className="text-white/80 hover:text-white ml-2"
                                    aria-label="Close success message"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-emerald-100">Order Number:</span>
                                    <span className="font-bold">#{successOrder.orderId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-emerald-100">Customer:</span>
                                    <span>{successOrder.customerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-emerald-100">Order Type:</span>
                                    <span className="capitalize">{successOrder.orderType.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-emerald-100">Items:</span>
                                    <span>{successOrder.itemsCount} items</span>
                                </div>
                                <div className="flex justify-between text-base font-bold pt-2 border-t border-white/20">
                                    <span>Total Amount:</span>
                                    <span>₱{formatPrice(successOrder.total)}</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 flex gap-2">
                                <button 
                                    onClick={() => {
                                        // Option: Print receipt
                                        window.print();
                                        setSuccessOrder(null);
                                    }}
                                    className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                    <Printer className="w-3 h-3" />
                                    Print Receipt
                                </button>
                                <button 
                                    onClick={() => setSuccessOrder(null)}
                                    className="flex-1 py-2 bg-white text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-bold transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="POS System - Live" />

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 animate-slide-in ${notification.type === 'success' 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' 
                        : notification.type === 'error' 
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                        : notification.type === 'warning'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : notification.type === 'error' ? (
                        <AlertCircle className="w-5 h-5" />
                    ) : (
                        <Bell className="w-5 h-5" />
                    )}
                    <span className="font-medium">{notification.message}</span>
                    <button 
                        onClick={() => setNotification(null)} 
                        className="ml-4 hover:opacity-80"
                        aria-label="Close notification"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ✅ FIXED: Success Order Popup */}
            <SuccessOrderPopup />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="container mx-auto px-2 sm:px-4 py-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={handleBack}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    aria-label="Go back"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                                    <ShoppingCart className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">Live POS System</h1>
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                                        <span>{appName}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>Welcome, {auth.user?.name}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <ConnectionStatusBadge />
                                    <button
                                        onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium flex items-center space-x-1 sm:space-x-2 ${showOnlyAvailable 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-gray-100 text-gray-700'}`}
                                        aria-label={showOnlyAvailable ? "Show all items" : "Show available only"}
                                    >
                                        {showOnlyAvailable ? (
                                            <>
                                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span className="text-xs sm:text-sm">Available</span>
                                            </>
                                        ) : (
                                            <>
                                                <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span className="text-xs sm:text-sm">All</span>
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        onClick={refreshAllData}
                                        disabled={isLoading}
                                        className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 flex items-center space-x-1 sm:space-x-2 disabled:opacity-50 text-xs sm:text-sm"
                                        aria-label="Refresh data"
                                    >
                                        <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                        <span>Refresh</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🍽️ TABLET-FRIENDLY LAYOUT - ORDER PANEL ALWAYS ON RIGHT */}
                <div className="container mx-auto px-2 sm:px-4 py-4">
                    {/* ✅ FIXED: On tablets (768px+), keep order panel on right side */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 🟦 LEFT COLUMN - MENU (2/3 width on tablet & desktop) */}
                        <div className="md:col-span-2">
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200">
                                {/* Menu Header */}
                                <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                                                <ChefHat className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Live Menu</h2>
                                                <p className="text-xs sm:text-sm text-gray-600">Updates automatically every 2 seconds</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="relative flex-1 sm:flex-none">
                                                {/* ✅ FIXED: Proper label association */}
                                                <label htmlFor="searchItems" className="sr-only">Search items</label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        id="searchItems"
                                                        name="searchItems"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Search items..."
                                                        className="w-full sm:w-48 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => setViewMode('grid')}
                                                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                                                    aria-label="Grid view"
                                                >
                                                    <Grid className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('list')}
                                                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                                                    aria-label="List view"
                                                >
                                                    <List className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Tabs - Horizontal Scroll on Mobile */}
                                    <div className="mt-3">
                                        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-thin">
                                            <button
                                                onClick={() => setActiveCategory('all')}
                                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium whitespace-nowrap flex-shrink-0 flex items-center space-x-2 ${activeCategory === 'all'
                                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span className="text-xs sm:text-sm">All Items</span>
                                                <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                                                    {categories.flatMap(cat => cat.items || []).length}
                                                </span>
                                            </button>
                                            {categories.map(category => {
                                                const Icon = categoryIcons[category.name] || ChefHat;
                                                const itemCount = category.items?.length || 0;
                                                return (
                                                    <button
                                                        key={category.id}
                                                        onClick={() => setActiveCategory(category.id.toString())}
                                                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium whitespace-nowrap flex items-center space-x-2 flex-shrink-0 ${activeCategory === category.id.toString()
                                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span className="text-xs sm:text-sm">{category.name}</span>
                                                        <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                                                            {itemCount}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ FIXED: 3x3 Menu Items Grid for Tablets */}
                                <div className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)] overflow-y-auto">
                                    <div className="p-3 sm:p-4">
                                        {viewMode === 'grid' ? (
                                            // ✅ ENHANCED: 3 columns on tablets (768px+), 4 on desktop
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                                                {filteredItems.map(item => {
                                                    const CategoryIcon = categoryIcons[categories.find(c => c.id === item.category_id)?.name] || ChefHat;
                                                    const isUnavailable = item.is_available === false;
                                                    const isLowStock = item.stock !== null && item.stock <= 5;
                                                    
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => !isUnavailable && addToOrder(item)}
                                                            disabled={isUnavailable}
                                                            className={`bg-white border rounded-lg sm:rounded-xl p-2 sm:p-3 transition-all duration-200 text-left flex flex-col h-full group min-h-[160px] sm:min-h-[180px]
                                                                ${isUnavailable 
                                                                    ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed' 
                                                                    : 'border-gray-200 hover:border-blue-500 hover:shadow-lg active:scale-[0.98]'
                                                                }`}
                                                        >
                                                            {/* Image/Icon - Optimized for 3x3 grid */}
                                                            <div className={`aspect-square w-full rounded-lg sm:rounded-xl mb-2 sm:mb-3 overflow-hidden flex-shrink-0 ${isUnavailable ? 'grayscale' : ''}`}>
                                                                {item.image ? (
                                                                    <img 
                                                                        src={`/storage/${item.image}`}
                                                                        alt={item.name}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                        loading="lazy"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                                                                        <CategoryIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Item Name - Optimized for smaller cards */}
                                                            <div className="flex-1 min-h-[40px]">
                                                                <div className="flex justify-between items-start mb-1 gap-1">
                                                                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm text-left leading-tight line-clamp-2">
                                                                        {item.name}
                                                                    </h3>
                                                                    {(isUnavailable || isLowStock) && (
                                                                        <div className="flex-shrink-0">
                                                                            <AvailabilityBadge isAvailable={item.is_available} stock={item.stock} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {item.description && (
                                                                    <p className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-2 line-clamp-2 leading-relaxed">
                                                                        {item.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Price & Category - Compact layout */}
                                                            <div className="mt-auto pt-1 sm:pt-2 border-t border-gray-100">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1 truncate">
                                                                        <CategoryIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                                        <span className="truncate">
                                                                            {categories.find(c => c.id === item.category_id)?.name}
                                                                        </span>
                                                                    </span>
                                                                    <span className={`text-sm sm:text-base font-bold ${isUnavailable ? 'text-gray-400' : 'text-emerald-600'}`}>
                                                                        ₱{formatPrice(item.price)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            // List View for Mobile
                                            <div className="space-y-2">
                                                {filteredItems.map(item => {
                                                    const CategoryIcon = categoryIcons[categories.find(c => c.id === item.category_id)?.name] || ChefHat;
                                                    const isUnavailable = item.is_available === false;
                                                    
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => !isUnavailable && addToOrder(item)}
                                                            disabled={isUnavailable}
                                                            className={`w-full bg-white border rounded-lg p-3 transition-all duration-200 text-left flex items-center gap-3 group
                                                                ${isUnavailable 
                                                                    ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed' 
                                                                    : 'border-gray-200 hover:border-blue-500 hover:shadow-md active:scale-[0.98]'
                                                                }`}
                                                        >
                                                            {/* Icon */}
                                                            <div className="flex-shrink-0">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUnavailable ? 'bg-red-100' : 'bg-blue-100'}`}>
                                                                    <CategoryIcon className={`w-5 h-5 ${isUnavailable ? 'text-red-400' : 'text-blue-500'}`} />
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Item Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                                    <h3 className="font-semibold text-gray-900 text-sm break-words">
                                                                        {item.name}
                                                                    </h3>
                                                                    <AvailabilityBadge isAvailable={item.is_available} stock={item.stock} />
                                                                </div>
                                                                {item.description && (
                                                                    <p className="text-xs text-gray-600 line-clamp-2">
                                                                        {item.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Price & Add Button */}
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <span className={`text-base font-bold ${isUnavailable ? 'text-gray-400' : 'text-emerald-600'}`}>
                                                                    ₱{formatPrice(item.price)}
                                                                </span>
                                                                {!isUnavailable && (
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow group-active:scale-110 transition-transform">
                                                                        <Plus className="w-4 h-4" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        
                                        {filteredItems.length === 0 && (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                                                    <Search className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-700 mb-2">No items found</h3>
                                                <p className="text-gray-500 mb-4">
                                                    {searchQuery ? 'Try a different search term' : 'No items in this category'}
                                                </p>
                                                {searchQuery && (
                                                    <button
                                                        onClick={() => setSearchQuery('')}
                                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:opacity-90 text-sm"
                                                    >
                                                        Clear Search
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🟪 RIGHT COLUMN - ORDER PANEL (1/3 width on tablet & desktop) - ALWAYS ON RIGHT */}
                        <div className="space-y-4">
                            {/* Order Summary Card */}
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200">
                                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-1.5 bg-white/10 rounded-lg">
                                                <ShoppingCart className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-white">Current Order</h2>
                                                <p className="text-xs text-gray-300 capitalize">{orderType.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                                                {orderItems.length} items
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Controls */}
                                <div className="p-4 border-b border-gray-200 space-y-4">
                                    {/* Order Type Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">Order Type</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {ORDER_TYPES.map(type => {
                                                const Icon = type.icon;
                                                return (
                                                    <button
                                                        key={type.value}
                                                        onClick={() => setOrderType(type.value)}
                                                        className={`py-2 rounded-lg flex flex-col items-center justify-center space-y-1 ${orderType === type.value
                                                                ? `${type.color} text-white shadow`
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        <span className="text-xs font-medium">{type.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* People & Cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-gray-900">People</span>
                                                <Users className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="flex items-center justify-center space-x-3">
                                                <button
                                                    onClick={() => peopleCount > 1 && setPeopleCount(peopleCount - 1)}
                                                    className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:scale-95"
                                                    aria-label="Decrease people count"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-xl font-bold text-gray-900 min-w-8 text-center">
                                                    {peopleCount}
                                                </span>
                                                <button
                                                    onClick={() => peopleCount < 20 && setPeopleCount(peopleCount + 1)}
                                                    className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:scale-95"
                                                    aria-label="Increase people count"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-gray-900">Cards</span>
                                                <Tag className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div className="flex items-center justify-center space-x-3">
                                                <button
                                                    onClick={() => cardsPresented > 0 && setCardsPresented(cardsPresented - 1)}
                                                    className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:scale-95"
                                                    aria-label="Decrease card count"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-xl font-bold text-gray-900 min-w-8 text-center">
                                                    {cardsPresented}
                                                </span>
                                                <button
                                                    onClick={() => cardsPresented < peopleCount && setCardsPresented(cardsPresented + 1)}
                                                    className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 active:scale-95"
                                                    aria-label="Increase card count"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="mt-1 text-[10px] text-gray-500 text-center">
                                                Total × 20% ÷ People × Cards
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setShowCustomerModal(true)}
                                            className="py-2 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-1 text-sm"
                                            aria-label="Customer information"
                                        >
                                            <Edit className="w-3 h-3" />
                                            Customer
                                        </button>
                                        <button
                                            onClick={() => setShowDiscountModal(true)}
                                            className="py-2 bg-gradient-to-r from-amber-100 to-yellow-50 border border-amber-200 rounded-lg font-medium text-amber-700 hover:bg-amber-50 flex items-center justify-center gap-1 text-sm"
                                            aria-label="Apply discount"
                                        >
                                            <Percent className="w-3 h-3" />
                                            Discount
                                        </button>
                                    </div>
                                </div>

                                {/* Order Items - Scrollable */}
                                <div className="h-[200px] sm:h-[250px] overflow-y-auto">
                                    <div className="p-4">
                                        {orderItems.length === 0 ? (
                                            <div className="text-center py-6">
                                                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Empty Order</h3>
                                                <p className="text-xs text-gray-500">Select items from the menu</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {orderItems.map((item, index) => {
                                                    const isUnavailable = item.is_available === false;
                                                    return (
                                                        <div key={`${item.id}-${index}`} className={`bg-gradient-to-r from-gray-50 to-white rounded-lg p-3 border ${isUnavailable ? 'border-red-200' : 'border-gray-200'}`}>
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    {/* ✅ FIXED: Full item name visible */}
                                                                    <div className="flex items-start gap-1 mb-1">
                                                                        <h4 className="font-semibold text-gray-900 text-sm break-words">
                                                                            {item.name}
                                                                        </h4>
                                                                        {isUnavailable && (
                                                                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-800 rounded-full whitespace-nowrap">
                                                                                Unavailable
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 mb-1">
                                                                        ₱{formatPrice(item.price)} × {item.quantity}
                                                                    </div>
                                                                    <div className="text-sm font-bold text-emerald-600">
                                                                        ₱{formatPrice(item.price * item.quantity)}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="flex items-center bg-white rounded-lg px-2 py-1 border border-gray-200">
                                                                        <button
                                                                            onClick={() => updateQuantity(index, -1)}
                                                                            className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded active:scale-95"
                                                                            aria-label={`Decrease ${item.name} quantity`}
                                                                        >
                                                                            <Minus className="w-2.5 h-2.5" />
                                                                        </button>
                                                                        <span className="w-6 text-center font-semibold text-gray-900 text-sm">
                                                                            {item.quantity}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => updateQuantity(index, 1)}
                                                                            className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded active:scale-95"
                                                                            aria-label={`Increase ${item.name} quantity`}
                                                                        >
                                                                            <Plus className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => removeItem(index)}
                                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg active:scale-95"
                                                                        aria-label={`Remove ${item.name} from order`}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Subtotal:</span>
                                            <span className="font-semibold text-gray-900">₱{formatPrice(subtotal)}</span>
                                        </div>
                                        {cardDiscount > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">
                                                    Card Discount ({cardsPresented} card{cardsPresented !== 1 ? 's' : ''}):
                                                </span>
                                                <span className="font-semibold text-emerald-600">-₱{formatPrice(cardDiscount)}</span>
                                            </div>
                                        )}
                                        {discount.value > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">
                                                    Additional Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed'}):
                                                </span>
                                                <span className="font-semibold text-amber-600">-₱{formatPrice(additionalDiscount)}</span>
                                            </div>
                                        )}
                                        {totalDiscount > 0 && (
                                            <div className="border-t border-gray-200 pt-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Total Discount:</span>
                                                    <span className="font-bold text-emerald-600">-₱{formatPrice(totalDiscount)}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="border-t border-gray-200 pt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-base font-bold text-gray-900">Total:</span>
                                                <span className="text-xl font-bold text-blue-600">₱{formatPrice(total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={clearOrder}
                                            disabled={orderItems.length === 0}
                                            className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 ${orderItems.length === 0
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:opacity-90 active:scale-[0.98]'
                                                }`}
                                            aria-label="Clear order"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="text-sm">Clear Order</span>
                                        </button>
                                        
                                        <button
                                            onClick={placeOrder}
                                            disabled={orderItems.length === 0 || isLoading}
                                            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-1.5 ${orderItems.length === 0 || isLoading
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 active:scale-[0.98]'
                                                }`}
                                            aria-label="Place order"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm">Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-sm">PLACE ORDER</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Orders Section */}
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200">
                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-1.5 bg-white/10 rounded-lg">
                                                <Clock className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-white">Pending Orders</h2>
                                                <p className="text-xs text-amber-100">Awaiting Payment</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                                            {pendingOrders.length} orders
                                        </span>
                                    </div>
                                </div>

                                <div className="h-[180px] sm:h-[200px] overflow-y-auto">
                                    <div className="p-4">
                                        {pendingOrders.length === 0 ? (
                                            <div className="text-center py-4">
                                                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No pending orders</p>
                                                <p className="text-xs text-gray-400">Updates automatically</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {pendingOrders.map((order) => (
                                                    <div key={order.id} className="border border-gray-200 rounded-lg p-3 bg-gradient-to-r from-amber-50 to-yellow-50 hover:shadow-sm transition-shadow">
                                                        <div className="flex flex-col gap-2 mb-2">
                                                            <div className="font-bold text-gray-800 text-sm">
                                                                Order #{order.id} • {order.formatted_total || `₱${parseFloat(order.total_amount).toFixed(2)}`}
                                                            </div>
                                                            <div className="text-xs text-gray-600 line-clamp-2">
                                                                {order.items_list || 'No items listed'}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 space-y-0.5">
                                                                {order.customer_name && (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="font-medium">Customer:</span>
                                                                        <span className="truncate">{order.customer_name}</span>
                                                                    </div>
                                                                )}
                                                                {order.people_count > 1 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Users className="w-2.5 h-2.5" />
                                                                        <span>{order.people_count} people</span>
                                                                    </div>
                                                                )}
                                                                {order.cards_presented > 0 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Tag className="w-2.5 h-2.5" />
                                                                        <span>{order.cards_presented} card(s)</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                {order.formatted_time || new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <button
                                                                onClick={() => markAsPaid(order.id)}
                                                                disabled={processingOrder === order.id}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${processingOrder === order.id
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:opacity-90 active:scale-95'
                                                                    }`}
                                                                aria-label={`Mark order #${order.id} as paid`}
                                                            >
                                                                {processingOrder === order.id ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <CreditCard className="w-3 h-3" />
                                                                )}
                                                                <span>Mark Paid</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Discount Modal */}
            {showDiscountModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Apply Discount</h2>
                                </div>
                                <button 
                                    onClick={() => setShowDiscountModal(false)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                                    aria-label="Close discount modal"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-4 sm:p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Discount Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setDiscount({ type: 'percentage', value: discount.value || 10 })}
                                            className={`py-2.5 rounded-lg font-medium text-sm ${discount.type === 'percentage'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Percentage %
                                        </button>
                                        <button
                                            onClick={() => setDiscount({ type: 'fixed', value: discount.value || 50 })}
                                            className={`py-2.5 rounded-lg font-medium text-sm ${discount.type === 'fixed'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Fixed ₱
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label htmlFor="discountValue" className="block text-sm font-semibold text-gray-900 mb-2">
                                        {discount.type === 'percentage' ? 'Percentage (%)' : 'Amount (₱)'}
                                    </label>
                                    <input
                                        type="number"
                                        id="discountValue"
                                        name="discountValue"
                                        value={discount.value}
                                        onChange={(e) => setDiscount({ ...discount, value: Math.max(0, Number(e.target.value)) })}
                                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder={discount.type === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                                        aria-describedby="discountDescription"
                                    />
                                    <p id="discountDescription" className="sr-only">
                                        {discount.type === 'percentage' ? 'Enter discount percentage' : 'Enter discount amount'}
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2">
                                    {discount.type === 'percentage' 
                                        ? [5, 10, 15, 20, 25, 30].map(pct => (
                                            <button
                                                key={pct}
                                                onClick={() => setDiscount({ ...discount, value: pct })}
                                                className={`py-1.5 rounded-lg text-sm ${discount.value === pct
                                                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                aria-label={`${pct}% discount`}
                                            >
                                                {pct}%
                                            </button>
                                        ))
                                        : [50, 100, 200, 500, 1000].map(amount => (
                                            <button
                                                key={amount}
                                                onClick={() => setDiscount({ ...discount, value: amount })}
                                                className={`py-1.5 rounded-lg text-sm ${discount.value === amount
                                                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                aria-label={`₱${amount} discount`}
                                            >
                                                ₱{amount}
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                            
                            <div className="mt-6 flex space-x-2">
                                <button
                                    onClick={() => {
                                        setDiscount({ type: 'none', value: 0 });
                                        setShowDiscountModal(false);
                                    }}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 text-sm"
                                    aria-label="Remove discount"
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={() => setShowDiscountModal(false)}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:opacity-90 text-sm"
                                    aria-label="Apply discount"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                        <div className="p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Customer Information</h2>
                                </div>
                                <button 
                                    onClick={() => setShowCustomerModal(false)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                                    aria-label="Close customer modal"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-4 sm:p-6 space-y-3">
                            <div>
                                <label htmlFor="customerName" className="block text-sm font-semibold text-gray-900 mb-1">Name (Optional)</label>
                                <input
                                    type="text"
                                    id="customerName"
                                    name="customerName"
                                    value={customerInfo.name}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    placeholder="Customer name"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    aria-describedby="customerNameDescription"
                                />
                                <p id="customerNameDescription" className="sr-only">Enter customer name (optional)</p>
                            </div>
                            
                            <div>
                                <label htmlFor="customerPhone" className="block text-sm font-semibold text-gray-900 mb-1">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    id="customerPhone"
                                    name="customerPhone"
                                    value={customerInfo.phone}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                    placeholder="Phone number"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    aria-describedby="customerPhoneDescription"
                                />
                                <p id="customerPhoneDescription" className="sr-only">Enter customer phone number (optional)</p>
                            </div>
                            
                            {orderType === 'delivery' && (
                                <div>
                                    <label htmlFor="customerAddress" className="block text-sm font-semibold text-gray-900 mb-1">Delivery Address</label>
                                    <textarea
                                        id="customerAddress"
                                        name="customerAddress"
                                        value={customerInfo.address}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                        placeholder="Full delivery address"
                                        rows="2"
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        aria-describedby="customerAddressDescription"
                                    />
                                    <p id="customerAddressDescription" className="sr-only">Enter delivery address</p>
                                </div>
                            )}
                            
                            <div>
                                <label htmlFor="orderNotes" className="block text-sm font-semibold text-gray-900 mb-1">Order Notes (Optional)</label>
                                <textarea
                                    id="orderNotes"
                                    name="orderNotes"
                                    value={customerInfo.notes}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                                    placeholder="Special instructions for kitchen..."
                                    rows="2"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    aria-describedby="orderNotesDescription"
                                />
                                <p id="orderNotesDescription" className="sr-only">Enter order notes for kitchen (optional)</p>
                            </div>
                        </div>
                        
                        <div className="p-4 sm:p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowCustomerModal(false)}
                                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 text-sm"
                                aria-label="Save customer information"
                            >
                                Save Information
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}