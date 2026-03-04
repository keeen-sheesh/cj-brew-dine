// resources/js/Pages/Admin/POS.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    X,
    Printer,
    ChefHat,
    ArrowLeft,
    Loader2,
    Percent,
    Tag,
    Edit,
    Grid,
    List,
    Star,
    Coffee,
    Pizza,
    Salad,
    Soup,
    Sandwich,
    Milk,
    GlassWater,
    Wine,
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
    WifiOff,
    Hotel,
    Wallet,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Building,
    Hash,
    Flame,
    Check,
    Hourglass,
    Zap,
    Activity,
    AlertTriangle,
    BadgePercent,
    Briefcase,
    Building2,
    MessageSquare,
    Settings,
    User,
    UserCircle,
    Heart,
    Gift
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
    'Rice (4-5 persons)': Utensils,
    'Soup and Salad': Soup,
    'Casa Jedliana Soup': Soup,
    'Side dish': Utensils,
    'Pork': ChefHat,
    'Chicken': ChefHat,
    'Fish & Seafoods': ChefHat,
    'Vegetables': Salad,
    'Rice in a bowl': Utensils,
    'Set Meals': Package,
    'American Breakfast': Coffee,
    'Filipino Breakfast': Coffee,
    'Breakfast Side dish': Utensils,
    'Beverages': Wine,
    'Add Ons': Plus,
};

// Order type options
const ORDER_TYPES = [
    { value: 'dine_in', label: 'Dine In', icon: TableIcon, color: 'bg-blue-500' },
    { value: 'takeout', label: 'Takeout', icon: Package, color: 'bg-emerald-500' },
    { value: 'delivery', label: 'Delivery', icon: Truck, color: 'bg-purple-500' },
];

// Payment methods - ADDED Personal as ID 5
const PAYMENT_METHODS = [
    { id: 1, name: 'Cash', icon: DollarSign, color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 2, name: 'Card', icon: CreditCard, color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 3, name: 'E-Wallet', icon: Wallet, color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 4, name: 'Hotel', icon: Hotel, color: 'bg-amber-500', textColor: 'text-amber-600', bgColor: 'bg-amber-50' },
    { id: 5, name: 'Personal', icon: Heart, color: 'bg-pink-500', textColor: 'text-pink-600', bgColor: 'bg-pink-50' },
];

// Price formatting
const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') return '0.00';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0.00';
    return numPrice.toFixed(2);
};

// Get display price for item based on its type
const getItemDisplayPrice = (item) => {
    if (item.sizes && item.sizes.length > 0) {
        const prices = item.sizes.map(s => s.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice === maxPrice) {
            return formatPrice(minPrice);
        }
        return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    }
    
    return formatPrice(item.price);
};

// Philippine time formatting
const formatPhilippineTime = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-PH', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Manila'
        });
    } catch (e) {
        return '';
    }
};

const getCurrentPhilippineTime = () => {
    return new Date().toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
    });
};

const getCurrentPhilippineDate = () => {
    return new Date().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Manila'
    });
};

// Get image URL helper function
const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const cleanPath = imagePath.replace(/^storage\//, '');
    return `/storage/${cleanPath}`;
};

// Category groups for employee discounts
const CATEGORY_GROUPS = {
    COFFEE: ['Coffee Based', 'Coffee', 'Milk Based', 'Frappe'],
    SODA: ['Soda', 'Soda & Bottled Drinks'],
    ADD_ONS: ['Add ons', 'Add Ons'],
    FOOD: [
        'Rice (4-5 persons)', 'Soup and Salad', 'Appetizer', 'Burgers & Sandwich',
        'Casa Jedliana Soup', 'Salad', 'Pasta', 'Noodles', 'Side dish', 'Pork',
        'Chicken', 'Fish & Seafoods', 'Vegetables', 'Rice in a bowl', 'Set Meals',
        'American Breakfast', 'Filipino Breakfast', 'Breakfast Side dish',
        'Main Dish', 'Burgers & Sandwiches', 'Appetizers', 'Soup'
    ]
};

// Size Selection Modal Component
const SizeSelectionModal = ({ isOpen, onClose, item, onSelect }) => {
    const [selectedSize, setSelectedSize] = useState(null);
    
    if (!isOpen || !item) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Select Size</h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div className="p-6">
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {item.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        {item.sizes.map(size => (
                            <button
                                key={size.id}
                                onClick={() => setSelectedSize(size)}
                                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                                    selectedSize?.id === size.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div>
                                    <span className="font-medium text-gray-900">
                                        {size.display_name || size.size_name}
                                    </span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">
                                    ₱{formatPrice(size.price)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (selectedSize) {
                                onSelect(selectedSize);
                                onClose();
                            }
                        }}
                        disabled={!selectedSize}
                        className={`flex-1 py-2 rounded-lg font-medium ${
                            selectedSize
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Add to Order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function POS({ 
    categories: initialCategories = [], 
    paymentMethods: initialPaymentMethods = [],
    pendingOrders: initialPendingOrders = [],
    readyOrders = [],
    appName = 'Restaurant POS',
    flash = {}
}) {
    const { auth } = usePage().props;
    
    // Determine API base URL based on user role
    const userRole = auth?.user?.role;
    const apiBase = userRole === 'admin' ? '/admin' : '/cashier';
    
    // ============ STATE MANAGEMENT ============
    const [categories, setCategories] = useState(initialCategories);
    const [pendingOrders, setPendingOrders] = useState(initialPendingOrders);
    const [orderItems, setOrderItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [orderType, setOrderType] = useState('dine_in');
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', notes: '' });
    
    // Hotel specific fields
    const [hotelInfo, setHotelInfo] = useState({ guestName: '', roomNumber: '' });
    
    // Employee and Personal fields
    const [employeeInfo, setEmployeeInfo] = useState({ name: '', id: '' });
    const [personalInfo, setPersonalInfo] = useState({ name: '', reason: '' });
    
    const [peopleCount, setPeopleCount] = useState(1);
    const [cardsPresented, setCardsPresented] = useState(0);
    const [discount, setDiscount] = useState({ type: 'none', value: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [processingOrder, setProcessingOrder] = useState(null);
    const [notification, setNotification] = useState(null);
    const [readyOrderNotifications, setReadyOrderNotifications] = useState([]);
    const [successOrder, setSuccessOrder] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connected');
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [showPendingOrders, setShowPendingOrders] = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);
    
    // Size selection state
    const [showSizeModal, setShowSizeModal] = useState(false);
    const [selectedItemForSize, setSelectedItemForSize] = useState(null);
    
    // Item notes state
    const [itemNotes, setItemNotes] = useState({});
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedItemForNotes, setSelectedItemForNotes] = useState(null);
    const [currentNote, setCurrentNote] = useState('');
    
    // Auto-refresh state
    const [isPollingActive, setIsPollingActive] = useState(true);
    const [pollingStats, setPollingStats] = useState({ menu: 0, orders: 0, errors: 0 });
    const [lastMenuUpdate, setLastMenuUpdate] = useState(Date.now());
    const [lastOrderUpdate, setLastOrderUpdate] = useState(Date.now());
    
    // Modal states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [cashAmount, setCashAmount] = useState('');
    const [modalPeopleCount, setModalPeopleCount] = useState(1);
    const [modalCardsPresented, setModalCardsPresented] = useState(0);
    const [modalIsEmployee, setModalIsEmployee] = useState(false);
    const [modalIsPersonal, setModalIsPersonal] = useState(false);
    
    // Refs
    const audioRef = useRef(null);
    const menuPollTimeoutRef = useRef(null);
    const orderPollTimeoutRef = useRef(null);
    const mountedRef = useRef(true);
    
    // Current time state for header
    const [currentTime, setCurrentTime] = useState(getCurrentPhilippineTime());
    const [currentDate, setCurrentDate] = useState(getCurrentPhilippineDate());

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio('/sound1.mp3');
        audioRef.current.volume = 0.5;
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, []);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(getCurrentPhilippineTime());
            setCurrentDate(getCurrentPhilippineDate());
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (menuPollTimeoutRef.current) clearTimeout(menuPollTimeoutRef.current);
            if (orderPollTimeoutRef.current) clearTimeout(orderPollTimeoutRef.current);
        };
    }, []);

    // ============ AUTO-REFRESH WITH ADAPTIVE POLLING ============
    
    // Menu polling function
    const pollMenuUpdates = useCallback(async () => {
        if (!mountedRef.current || !isPollingActive) return;
        
        try {
            const response = await fetch(`${apiBase}/pos/menu-updates?last_update=${lastMenuUpdate}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache',
                },
            });
            
            if (!mountedRef.current) return;
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    setConnectionStatus('connected');
                    setPollingStats(prev => ({ ...prev, menu: prev.menu + 1, errors: 0 }));
                    
                    if (data.updated && data.categories) {
                        setCategories(data.categories);
                        setLastMenuUpdate(data.menu_last_updated || Date.now());
                        setLastUpdate(new Date());
                    }
                    
                    if (mountedRef.current && isPollingActive) {
                        menuPollTimeoutRef.current = setTimeout(pollMenuUpdates, 2000);
                    }
                } else {
                    throw new Error('Invalid response');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Menu polling error:', error);
            
            if (!mountedRef.current) return;
            
            setConnectionStatus('disconnected');
            setPollingStats(prev => ({ ...prev, errors: prev.errors + 1 }));
            
            const backoffTime = Math.min(30000, 2000 * Math.pow(1.5, pollingStats.errors));
            
            if (mountedRef.current && isPollingActive) {
                menuPollTimeoutRef.current = setTimeout(pollMenuUpdates, backoffTime);
            }
        }
    }, [lastMenuUpdate, isPollingActive, pollingStats.errors, apiBase]);

    // Order polling function - checks for ready orders
    const pollOrderUpdates = useCallback(async () => {
        if (!mountedRef.current || !isPollingActive) return;
        
        try {
            const response = await fetch(`${apiBase}/pos/order-updates?last_update=${lastOrderUpdate}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache',
                },
            });
            
            if (!mountedRef.current) return;
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    setConnectionStatus('connected');
                    setPollingStats(prev => ({ ...prev, orders: prev.orders + 1, errors: 0 }));
                    
                    if (data.pending_orders) {
                        // Format order numbers for display
                        const formattedOrders = data.pending_orders.map(order => ({
                            ...order,
                            display_order_number: order.order_number || `ORD-${String(order.id).padStart(5, '0')}`
                        }));
                        
                        // Check for newly ready orders
                        const previousOrders = pendingOrders;
                        const newReadyOrders = formattedOrders.filter(newOrder => {
                            const oldOrder = previousOrders.find(o => o.id === newOrder.id);
                            return oldOrder && oldOrder.status !== 'ready' && newOrder.status === 'ready';
                        });
                        
                        // Add new ready orders to notifications
                        if (newReadyOrders.length > 0) {
                            setReadyOrderNotifications(prev => [
                                ...prev,
                                ...newReadyOrders.map(order => ({
                                    id: order.id,
                                    orderNumber: order.display_order_number,
                                    customerName: order.customer_name || 'Walk-in Customer',
                                    isHotel: order.payment_method_name === 'Hotel',
                                    roomNumber: order.room_number,
                                    timestamp: Date.now()
                                }))
                            ]);
                        }
                        
                        setPendingOrders(formattedOrders);
                    }
                    
                    setLastOrderUpdate(Date.now());
                    setLastUpdate(new Date());
                    
                    if (mountedRef.current && isPollingActive) {
                        orderPollTimeoutRef.current = setTimeout(pollOrderUpdates, 3000);
                    }
                } else {
                    throw new Error('Invalid response');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Order polling error:', error);
            
            if (!mountedRef.current) return;
            
            setConnectionStatus('disconnected');
            setPollingStats(prev => ({ ...prev, errors: prev.errors + 1 }));
            
            const backoffTime = Math.min(30000, 3000 * Math.pow(1.5, pollingStats.errors));
            
            if (mountedRef.current && isPollingActive) {
                orderPollTimeoutRef.current = setTimeout(pollOrderUpdates, backoffTime);
            }
        }
    }, [lastOrderUpdate, isPollingActive, pollingStats.errors, pendingOrders, apiBase]);

    // Start polling
    useEffect(() => {
        pollMenuUpdates();
        pollOrderUpdates();
        
        const handleVisibilityChange = () => {
            setIsPollingActive(!document.hidden);
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (menuPollTimeoutRef.current) clearTimeout(menuPollTimeoutRef.current);
            if (orderPollTimeoutRef.current) clearTimeout(orderPollTimeoutRef.current);
        };
    }, [pollMenuUpdates, pollOrderUpdates]);

    // Helper function to get category name by ID
    const getCategoryName = (categoryId) => {
        for (const category of categories) {
            if (category.id === categoryId) {
                return category.name;
            }
            if (category.items) {
                const item = category.items.find(i => i.id === categoryId);
                if (item) return category.name;
            }
        }
        return '';
    };

    // Calculate employee discounts based on category
    const calculateEmployeeDiscount = (items) => {
        let totalEmployeeDiscount = 0;
        
        items.forEach(item => {
            let categoryName = '';
            for (const category of categories) {
                const found = category.items?.find(i => i.id === item.id);
                if (found) {
                    categoryName = category.name;
                    break;
                }
            }
            
            const itemSubtotal = Number(item.price) * item.quantity;
            
            if (CATEGORY_GROUPS.COFFEE.includes(categoryName)) {
                totalEmployeeDiscount += itemSubtotal * 0.20;
            } else if (CATEGORY_GROUPS.SODA.includes(categoryName)) {
                totalEmployeeDiscount += itemSubtotal * 0.10;
            } else if (CATEGORY_GROUPS.FOOD.includes(categoryName)) {
                totalEmployeeDiscount += itemSubtotal * 0.05;
            }
        });
        
        return Math.round(totalEmployeeDiscount * 100) / 100;
    };

    // ============ CALCULATIONS ============
    const calculateTotals = (people, cards, discType, discValue, isEmployeeActive, isPersonalActive, items, selectedPaymentMethod) => {
        const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        
        let employeeDiscount = 0;
        if (isEmployeeActive) {
            employeeDiscount = calculateEmployeeDiscount(items);
        }
        
        let afterEmployeeDiscount = subtotal - employeeDiscount;
        let cardDiscount = 0;
        if (cards > 0 && people > 0) {
            cardDiscount = (afterEmployeeDiscount * 0.20) / people * cards;
            cardDiscount = Math.round(cardDiscount * 100) / 100;
        }
        
        let afterCardDiscount = afterEmployeeDiscount - cardDiscount;
        let additionalDiscount = 0;
        if (discType === 'percentage' && discValue > 0) {
            additionalDiscount = (afterCardDiscount * discValue) / 100;
        } else if (discType === 'fixed' && discValue > 0) {
            additionalDiscount = discValue;
        }
        additionalDiscount = Math.round(additionalDiscount * 100) / 100;
        
        let afterAllDiscounts = afterCardDiscount - additionalDiscount;
        
        let serviceCharge = 0;
        if (selectedPaymentMethod?.name === 'Hotel') {
            serviceCharge = afterAllDiscounts * 0.10;
            serviceCharge = Math.round(serviceCharge * 100) / 100;
        }
        
        // Personal orders still show total (for display) but will be marked as free in notes
        let finalTotal = afterAllDiscounts + serviceCharge;
        
        return {
            subtotal,
            employeeDiscount,
            cardDiscount,
            additionalDiscount,
            serviceCharge,
            totalDiscount: employeeDiscount + cardDiscount + additionalDiscount,
            total: finalTotal < 0 ? 0 : finalTotal,
            originalTotal: afterAllDiscounts + serviceCharge
        };
    };

    const { subtotal, employeeDiscount, cardDiscount, additionalDiscount, serviceCharge, total, originalTotal } = calculateTotals(
        peopleCount, cardsPresented, discount.type, discount.value, modalIsEmployee, modalIsPersonal, orderItems, selectedPaymentMethod
    );

    const modalTotals = calculateTotals(
        modalPeopleCount, modalCardsPresented, discount.type, discount.value, modalIsEmployee, modalIsPersonal, orderItems, selectedPaymentMethod
    );

    // ============ FILTERING ============
    const filterItems = (items) => {
        let filtered = items || [];
        if (showOnlyAvailable) {
            filtered = filtered.filter(item => item.is_available !== false);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(query) ||
                (item.description && item.description.toLowerCase().includes(query))
            );
        }
        return filtered;
    };

    const getFilteredItems = () => {
        if (!categories || categories.length === 0) return [];
        
        const allItems = categories.flatMap(cat => 
            (cat.items || []).map(item => ({
                ...item,
                category_name: cat.name,
                category_id: cat.id
            }))
        );

        if (activeCategory === 'all') {
            return filterItems(allItems);
        } else {
            return filterItems(allItems.filter(item => item.category_id.toString() === activeCategory));
        }
    };

    const filteredItems = getFilteredItems();

    // ============ NOTIFICATIONS ============
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const dismissReadyNotification = (notificationId) => {
        setReadyOrderNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const dismissAllNotifications = () => {
        setReadyOrderNotifications([]);
    };

    const showSuccessOrder = (orderData) => {
        setSuccessOrder(orderData);
        setTimeout(() => setSuccessOrder(null), 5000);
    };

    // ============ ORDER MANAGEMENT WITH STOCK CHECKING ============
    const addToOrder = (item) => {
        if (item.is_available === false) {
            showNotification(`${item.name} is unavailable`, 'error');
            return;
        }
        
        // Check if item has sizes
        if (item.sizes && item.sizes.length > 0) {
            setSelectedItemForSize(item);
            setShowSizeModal(true);
            return;
        }
        
        // Regular item without sizes
        addItemToCart(item, item.price, null);
    };
    
    const addItemToCart = (item, price, selectedSize) => {
        // Check stock
        if (item.stock_quantity !== null) {
            const existingItem = orderItems.find(oi => 
                oi.id === item.id && 
                (selectedSize ? oi.size_id === selectedSize.size_id : !oi.size_id)
            );
            const currentQuantity = existingItem ? existingItem.quantity : 0;
            
            if (currentQuantity + 1 > item.stock_quantity) {
                showNotification(`Only ${item.stock_quantity} ${item.stock_quantity === 1 ? 'item' : 'items'} available`, 'error');
                return;
            }
        }
        
        const existingItemIndex = orderItems.findIndex(oi => 
            oi.id === item.id && 
            (selectedSize ? oi.size_id === selectedSize.size_id : !oi.size_id)
        );
        
        if (existingItemIndex >= 0) {
            const updatedItems = [...orderItems];
            updatedItems[existingItemIndex].quantity += 1;
            setOrderItems(updatedItems);
        } else {
            const newItem = {
                id: item.id,
                name: item.name,
                price: Number(price),
                quantity: 1,
                stock: item.stock_quantity,
                originalStock: item.stock_quantity,
                image: item.image,
                notes: ''
            };
            
            // Add size information if selected
            if (selectedSize) {
                newItem.size_id = selectedSize.size_id;
                newItem.size_name = selectedSize.display_name || selectedSize.size_name;
            }
            
            setOrderItems([...orderItems, newItem]);
        }
        
        const displayName = selectedSize 
            ? `${item.name} (${selectedSize.display_name || selectedSize.size_name})` 
            : item.name;
        showNotification(`${displayName} added`, 'success');
    };

    // Handle size selection
    const handleSizeSelect = (size) => {
        addItemToCart(selectedItemForSize, size.price, size);
    };

    // Open notes modal for item
    const openNotesModal = (index) => {
        setSelectedItemForNotes(index);
        setCurrentNote(orderItems[index].notes || '');
        setShowNotesModal(true);
    };

    // Save note for item
    const saveItemNote = () => {
        if (selectedItemForNotes !== null) {
            const updatedItems = [...orderItems];
            updatedItems[selectedItemForNotes].notes = currentNote;
            setOrderItems(updatedItems);
            setShowNotesModal(false);
            setSelectedItemForNotes(null);
            setCurrentNote('');
            showNotification('Note added', 'success');
        }
    };

    const updateQuantity = (index, change) => {
        const updatedItems = [...orderItems];
        const item = updatedItems[index];
        const newQuantity = item.quantity + change;
        
        if (newQuantity < 1) {
            updatedItems.splice(index, 1);
            setOrderItems(updatedItems);
            const displayName = item.size_name 
                ? `${item.name} (${item.size_name})` 
                : item.name;
            showNotification(`${displayName} removed`, 'info');
            return;
        }
        
        if (change > 0 && item.stock !== null && newQuantity > item.stock) {
            showNotification(`Only ${item.stock} available`, 'warning');
            return;
        }
        
        item.quantity = newQuantity;
        setOrderItems(updatedItems);
    };

    const removeItem = (index) => {
        const item = orderItems[index];
        const displayName = item.size_name 
            ? `${item.name} (${item.size_name})` 
            : item.name;
        const updatedItems = orderItems.filter((_, i) => i !== index);
        setOrderItems(updatedItems);
        showNotification(`${displayName} removed`, 'info');
    };

    const clearOrder = () => {
        if (orderItems.length === 0) return;
        if (window.confirm('Clear entire order?')) {
            setOrderItems([]);
            setCustomerInfo({ name: '', phone: '', address: '', notes: '' });
            setHotelInfo({ guestName: '', roomNumber: '' });
            setEmployeeInfo({ name: '', id: '' });
            setPersonalInfo({ name: '', reason: '' });
            setPeopleCount(1);
            setCardsPresented(0);
            setModalIsEmployee(false);
            setModalIsPersonal(false);
            setDiscount({ type: 'none', value: 0 });
            setItemNotes({});
            showNotification('Order cleared', 'info');
        }
    };

    // ============ MODAL HANDLERS ============
    const openPaymentModal = () => {
        if (orderItems.length === 0) {
            showNotification('Add items first', 'error');
            return;
        }

        for (const cartItem of orderItems) {
            let currentStock = null;
            for (const category of categories) {
                const found = category.items?.find(i => i.id === cartItem.id);
                if (found) {
                    currentStock = found.stock_quantity;
                    break;
                }
            }
            
            if (currentStock !== null && currentStock !== undefined) {
                if (cartItem.quantity > currentStock) {
                    showNotification(`Stock changed for ${cartItem.name}. Only ${currentStock} available.`, 'error');
                    const updatedItems = orderItems.map(item => 
                        item.id === cartItem.id ? { ...item, stock: currentStock } : item
                    );
                    setOrderItems(updatedItems);
                    return;
                }
            }
        }

        setModalPeopleCount(peopleCount);
        setModalCardsPresented(cardsPresented);
        setModalIsEmployee(false);
        setModalIsPersonal(false);
        setSelectedPaymentMethod(null);
        setCashAmount('');
        setHotelInfo({ guestName: '', roomNumber: '' });
        setEmployeeInfo({ name: '', id: '' });
        setPersonalInfo({ name: '', reason: '' });
        setShowPaymentModal(true);
    };

    const openDiscountModal = () => {
        setShowDiscountModal(true);
    };

    // ============ ORDER SUBMISSION ============
    const handlePlaceOrder = () => {
        // Validation for employee
        if (modalIsEmployee && !employeeInfo.name) {
            showNotification('Please enter employee name', 'error');
            return;
        }

        // Validation for personal
        if (modalIsPersonal && !personalInfo.name) {
            showNotification('Please enter personal name', 'error');
            return;
        }

        // For personal orders, auto-select Personal payment method
        if (modalIsPersonal) {
            setSelectedPaymentMethod({ id: 5, name: 'Personal' });
        }

        if (!selectedPaymentMethod && !modalIsPersonal) {
            showNotification('Select payment method', 'error');
            return;
        }

        if (selectedPaymentMethod?.name === 'Cash' && (!cashAmount || Number(cashAmount) < modalTotals.total)) {
            showNotification('Invalid cash amount', 'error');
            return;
        }

        if (selectedPaymentMethod?.name === 'Hotel' && (!hotelInfo.guestName || !hotelInfo.roomNumber)) {
            showNotification('Enter guest name and room number', 'error');
            return;
        }

        for (const cartItem of orderItems) {
            let currentStock = null;
            for (const category of categories) {
                const found = category.items?.find(i => i.id === cartItem.id);
                if (found) {
                    currentStock = found.stock_quantity;
                    break;
                }
            }
            
            if (currentStock !== null && currentStock !== undefined && cartItem.quantity > currentStock) {
                showNotification(`Insufficient stock for ${cartItem.name}`, 'error');
                setShowPaymentModal(false);
                return;
            }
        }

        setIsLoading(true);
        setShowPaymentModal(false);

        let finalCustomerName = customerInfo.name;
        let roomNumber = null;
        let orderNotes = customerInfo.notes || '';
        
        if (selectedPaymentMethod?.name === 'Hotel') {
            finalCustomerName = `[HOTEL] ${hotelInfo.guestName}`;
            roomNumber = hotelInfo.roomNumber;
        } else if (modalIsEmployee) {
            finalCustomerName = `[EMPLOYEE] ${employeeInfo.name}`;
            if (employeeInfo.id) {
                orderNotes += ` Employee ID: ${employeeInfo.id}`;
            }
        } else if (modalIsPersonal) {
            finalCustomerName = `[PERSONAL] ${personalInfo.name}`;
            if (personalInfo.reason) {
                orderNotes += ` Reason: ${personalInfo.reason}`;
            }
            // Add free note
            orderNotes += ` [FREE ORDER - Personal]`;
        } else if (orderType === 'delivery' && customerInfo.name) {
            finalCustomerName = customerInfo.name;
        }

        // Calculate final totals with all discounts and service charge
        const finalTotals = calculateTotals(
            modalPeopleCount, 
            modalCardsPresented, 
            discount.type, 
            discount.value, 
            modalIsEmployee,
            modalIsPersonal,
            orderItems, 
            selectedPaymentMethod
        );

        // Format items with size information
        const formattedItems = orderItems.map(item => {
            const itemData = {
                id: item.id,
                name: item.name,
                price: Number(item.price),
                quantity: item.quantity,
                notes: item.notes || null
            };
            
            // Add size information if present
            if (item.size_id) {
                itemData.size_id = item.size_id;
            }
            
            return itemData;
        });

        // For personal orders, use payment method ID 5 (Personal) and keep original total
        // The backend will handle marking it as free/complimentary
        const paymentMethodId = modalIsPersonal ? 5 : selectedPaymentMethod?.id;
        const totalAmount = finalTotals.total; // Keep original total for personal orders

        const orderData = {
            items: formattedItems,
            order_type: orderType,
            customer_name: finalCustomerName || null,
            room_number: roomNumber,
            customer_phone: customerInfo.phone || null,
            customer_address: customerInfo.address || null,
            notes: orderNotes || null,
            people_count: modalPeopleCount,
            cards_presented: modalCardsPresented,
            discount_type: discount.type,
            discount_value: discount.value,
            is_employee: modalIsEmployee ? 1 : 0,
            is_personal: modalIsPersonal ? 1 : 0,
            employee_discount_amount: finalTotals.employeeDiscount,
            service_charge: finalTotals.serviceCharge,
            payment_method_id: paymentMethodId,
            subtotal: finalTotals.subtotal,
            total_amount: totalAmount,
            original_total: finalTotals.originalTotal
        };

        router.post(`${apiBase}/pos/orders`, orderData, {
            onSuccess: (response) => {
                const orderId = response.props.flash?.order_data?.order_id || Date.now();
                const formattedOrderNumber = `ORD-${String(orderId).padStart(5, '0')}`;
                
                const successData = {
                    orderId: formattedOrderNumber,
                    total: totalAmount,
                    originalTotal: finalTotals.originalTotal,
                    itemsCount: orderItems.length,
                    customerName: finalCustomerName || 'Walk-in',
                    orderType: orderType,
                    paymentMethod: modalIsPersonal ? 'Personal (Free)' : (selectedPaymentMethod?.name || 'Cash'),
                    hasEmployeeDiscount: modalIsEmployee,
                    hasServiceCharge: selectedPaymentMethod?.name === 'Hotel',
                    isPersonal: modalIsPersonal,
                    roomNumber: roomNumber
                };
                
                showSuccessOrder(successData);
                setOrderItems([]);
                setCustomerInfo({ name: '', phone: '', address: '', notes: '' });
                setHotelInfo({ guestName: '', roomNumber: '' });
                setEmployeeInfo({ name: '', id: '' });
                setPersonalInfo({ name: '', reason: '' });
                setPeopleCount(1);
                setCardsPresented(0);
                setModalIsEmployee(false);
                setModalIsPersonal(false);
                setDiscount({ type: 'none', value: 0 });
                setItemNotes({});
                setIsLoading(false);
                
                setLastMenuUpdate(Date.now());
                setLastOrderUpdate(Date.now());
            },
            onError: (errors) => {
                console.error('Order error:', errors);
                showNotification('Failed to place order', 'error');
                setIsLoading(false);
                setShowPaymentModal(true);
            }
        });
    };

    // ============ ORDER COMPLETION ============
    const completeOrder = (orderId) => {
        if (!window.confirm('Complete this order?')) return;
        
        setProcessingOrder(orderId);
        
        fetch(`${apiBase}/orders/${orderId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Accept': 'application/json',
            },
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message || `Order #${orderId} completed`, 'success');
                setPendingOrders(prev => prev.filter(order => order.id !== orderId));
                setReadyOrderNotifications(prev => prev.filter(n => n.id !== orderId));
                setLastOrderUpdate(Date.now());
            } else {
                showNotification(data.error || 'Failed to complete order', 'error');
            }
            setProcessingOrder(null);
        })
        .catch(error => {
            console.error('Complete order error:', error);
            showNotification('Failed to complete order', 'error');
            setProcessingOrder(null);
        });
    };

    // ============ MANUAL REFRESH ============
    const refreshAllData = async () => {
        setIsLoading(true);
        try {
            const [menuRes, orderRes] = await Promise.all([
                fetch(`${apiBase}/pos/menu-data`, {
                    headers: { 'Cache-Control': 'no-cache' }
                }),
                fetch(`${apiBase}/pos/order-data`, {
                    headers: { 'Cache-Control': 'no-cache' }
                })
            ]);
            
            const menuData = await menuRes.json();
            const orderData = await orderRes.json();
            
            if (menuData.success) setCategories(menuData.categories);
            if (orderData.success) {
                const formattedOrders = orderData.pending_orders.map(order => ({
                    ...order,
                    display_order_number: `ORD-${String(order.id).padStart(5, '0')}`
                }));
                setPendingOrders(formattedOrders);
            }
            
            setLastUpdate(new Date());
            setLastMenuUpdate(Date.now());
            setLastOrderUpdate(Date.now());
            showNotification('Data refreshed', 'success');
        } catch (error) {
            showNotification('Refresh failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ============ UI COMPONENTS ============
    const ConnectionStatusBadge = () => (
        <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${connectionStatus === 'connected' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {connectionStatus === 'connected' ? (
                    <Wifi className="w-3 h-3 text-emerald-600" />
                ) : (
                    <WifiOff className="w-3 h-3 text-red-600" />
                )}
                <span className={`text-xs font-medium ${connectionStatus === 'connected' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                </span>
            </div>
            
            <span className="text-xs text-gray-400">
                {lastUpdate.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' })}
            </span>
        </div>
    );

    // Ready Order Notifications Component
    const ReadyOrderNotifications = () => {
        if (readyOrderNotifications.length === 0) return null;
        
        return (
            <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
                {readyOrderNotifications.map((notification, index) => (
                    <div 
                        key={notification.id} 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-2xl p-5 animate-slide-in border-l-8 border-yellow-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white/20 rounded-full">
                                <ChefHat className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-xl">🍳 Order Ready!</h3>
                                        <p className="text-green-100 text-sm mt-1">Kitchen has completed preparation</p>
                                    </div>
                                    <button 
                                        onClick={() => dismissReadyNotification(notification.id)}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="bg-white/10 rounded-lg p-4 mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm opacity-90">Order Number</span>
                                        <span className="font-mono font-bold text-lg">{notification.orderNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm opacity-90">Customer</span>
                                        <span className="font-semibold">{notification.customerName}</span>
                                    </div>
                                    {notification.isHotel && (
                                        <div className="mt-2 flex items-center gap-1 text-yellow-200 text-xs">
                                            <Building2 className="w-3 h-3" />
                                            <span>Hotel Order</span>
                                            {notification.roomNumber && (
                                                <span className="ml-1">- Room {notification.roomNumber}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            completeOrder(notification.id);
                                            dismissReadyNotification(notification.id);
                                        }}
                                        className="flex-1 py-3 bg-white text-green-700 rounded-lg font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        MARK COMPLETED
                                    </button>
                                    <button
                                        onClick={() => dismissReadyNotification(notification.id)}
                                        className="px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                    >
                                        Later
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {readyOrderNotifications.length > 1 && (
                    <button
                        onClick={dismissAllNotifications}
                        className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                    >
                        Dismiss All ({readyOrderNotifications.length})
                    </button>
                )}
            </div>
        );
    };

    // Success Order Popup - at top right
    const SuccessOrderPopup = () => {
        if (!successOrder) return null;
        return (
            <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-sm">
                <div className={`bg-gradient-to-r rounded-xl shadow-xl p-4 ${
                    successOrder.isPersonal 
                        ? 'from-pink-500 to-rose-500' 
                        : 'from-emerald-500 to-green-500'
                } text-white`}>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                            {successOrder.isPersonal ? <Heart className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg truncate">
                                    {successOrder.isPersonal ? 'Personal Order!' : 'Order Placed!'}
                                </h3>
                                <button onClick={() => setSuccessOrder(null)} className="text-white/80 hover:text-white ml-2 flex-shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Order:</span>
                                    <span className="font-bold">{successOrder.orderId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Payment:</span>
                                    <span>{successOrder.paymentMethod}</span>
                                </div>
                                {successOrder.isPersonal && (
                                    <div className="flex justify-between text-yellow-200">
                                        <span>Total:</span>
                                        <span>₱{formatPrice(successOrder.total)} (Free)</span>
                                    </div>
                                )}
                                {successOrder.hasEmployeeDiscount && (
                                    <div className="flex justify-between text-yellow-200">
                                        <span>Employee Discount</span>
                                        <span>✓</span>
                                    </div>
                                )}
                                {successOrder.hasServiceCharge && (
                                    <div className="flex justify-between text-yellow-200">
                                        <span>Hotel Service Charge</span>
                                        <span>✓</span>
                                    </div>
                                )}
                                {successOrder.roomNumber && (
                                    <div className="flex justify-between text-yellow-200">
                                        <span>Room</span>
                                        <span>{successOrder.roomNumber}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-bold pt-2 border-t border-white/20">
                                    <span>Total:</span>
                                    <span>₱{formatPrice(successOrder.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Get status badge based on order status and kitchen items
    const getOrderStatusBadge = (order) => {
        if (order.status === 'completed') {
            return { text: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle };
        }
        if (order.status === 'ready') {
            return { text: 'Ready to Pickup', color: 'bg-emerald-100 text-emerald-800', icon: Check };
        }
        if (order.status === 'preparing') {
            return { text: 'Preparing', color: 'bg-blue-100 text-blue-800', icon: Flame };
        }
        if (order.kitchen_status === 'pending') {
            return { text: 'In Kitchen', color: 'bg-amber-100 text-amber-800', icon: ChefHat };
        }
        return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Hourglass };
    };

    // Check if order can be completed
    const canCompleteOrder = (order) => {
        // Order can be completed if:
        // 1. It has no kitchen items (non-kitchen order like soda)
        // 2. OR it has kitchen items and status is 'ready'
        return !order.has_kitchen_items || order.status === 'ready';
    };

    // Get button text for order
    const getOrderButton = (order) => {
        // If order has no kitchen items (like soda), show Complete button immediately
        if (!order.has_kitchen_items) {
            return { text: 'Complete', color: 'bg-green-500 hover:bg-green-600', icon: CheckCircle, disabled: false };
        }
        
        // For orders with kitchen items, only show Complete when kitchen marks as ready
        if (order.status === 'ready') {
            return { text: 'Complete', color: 'bg-green-500 hover:bg-green-600', icon: CheckCircle, disabled: false };
        }
        
        // For orders with kitchen items that are not ready
        if (order.status === 'pending') {
            if (order.kitchen_status === 'pending') {
                return { text: 'In Kitchen', color: 'bg-amber-500 cursor-not-allowed', icon: ChefHat, disabled: true };
            }
            return { text: 'Pending', color: 'bg-amber-500 cursor-not-allowed', icon: Hourglass, disabled: true };
        }
        
        if (order.status === 'preparing') {
            return { text: 'Preparing', color: 'bg-blue-500 cursor-not-allowed', icon: Flame, disabled: true };
        }
        
        // Default fallback
        return { text: 'Complete', color: 'bg-green-500 hover:bg-green-600', icon: CheckCircle, disabled: false };
    };

    // Check if order is hotel order
    const isHotelOrder = (order) => {
        return order.customer_name?.includes('[HOTEL]') || order.payment_method_name === 'Hotel';
    };

    // Check if order is personal order
    const isPersonalOrder = (order) => {
        return order.customer_name?.includes('[PERSONAL]');
    };

    // Filter pending orders
    const filteredPendingOrders = pendingOrders.filter(order => 
        order.status !== 'completed' && order.status !== 'cancelled'
    );

    return (
        <>
            <Head title="POS System" />

            {/* Size Selection Modal */}
            <SizeSelectionModal
                isOpen={showSizeModal}
                onClose={() => {
                    setShowSizeModal(false);
                    setSelectedItemForSize(null);
                }}
                item={selectedItemForSize}
                onSelect={handleSizeSelect}
            />

            {/* Ready Order Notifications */}
            <ReadyOrderNotifications />

            {/* Success Order Popup - TOP RIGHT */}
            <SuccessOrderPopup />

            {/* Regular Notifications */}
            {notification && (
                <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in ${
                    notification.type === 'success' ? 'bg-emerald-500' :
                    notification.type === 'error' ? 'bg-red-500' : 'bg-amber-500'
                } text-white`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                     notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                     <Bell className="w-5 h-5" />}
                    <span className="font-medium">{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-auto hover:opacity-80">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Main Container */}
            <div className="h-screen bg-gray-100 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => {
                                const path = typeof window !== 'undefined' ? window.location.pathname : '';
                                const back = path.startsWith('/cashier') ? '/cashier' : '/admin/dashboard';
                                router.visit(back);
                            }} className="p-2 hover:bg-gray-100 rounded-lg">
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">CJ BREW & DINE</h1>
                                <p className="text-sm text-gray-500">{currentDate} {currentTime}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ConnectionStatusBadge />
                            
                            <button 
                                onClick={refreshAllData} 
                                disabled={isLoading} 
                                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 disabled:opacity-50 flex items-center gap-2">
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="text-sm">Refresh</span>
                            </button>
                            <button
                                onClick={() => setShowPendingOrders(!showPendingOrders)}
                                className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>Pending ({filteredPendingOrders.length})</span>
                                {showPendingOrders ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => (window.location.href = '/logout')}
                                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                title="Logout"
                            >
                                {/* Re-using an existing icon color palette, small and unobtrusive */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                    <polyline points="16 17 21 12 16 7"/>
                                    <line x1="21" y1="12" x2="9" y2="12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column - Current Order */}
                    <div className="w-[30%] bg-white border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Current Order</h2>
                        </div>

                        {/* Order Items */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {orderItems.length === 0 ? (
                                <div className="text-center py-8">
                                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500">No items in order</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orderItems.map((item, index) => (
                                        <div key={index} className="border-b border-gray-100 pb-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                                                    {item.size_name && (
                                                        <p className="text-xs text-blue-600 mt-0.5">{item.size_name}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openNotesModal(index)}
                                                        className="text-blue-500 hover:text-blue-600 p-1"
                                                        title="Add note"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">{item.quantity} x ₱{formatPrice(item.price)}</span>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => updateQuantity(index, -1)}
                                                            className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center">
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(index, 1)}
                                                            className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center">
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-blue-600">₱{formatPrice(item.price * item.quantity)}</span>
                                            </div>
                                            {item.notes && (
                                                <p className="text-xs text-amber-600 mt-1 italic bg-amber-50 p-1 rounded">
                                                    📝 {item.notes}
                                                </p>
                                            )}
                                            {item.stock !== null && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Stock available: {item.stock}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                            {/* Order Type */}
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    {ORDER_TYPES.map(type => {
                                        const Icon = type.icon;
                                        return (
                                            <button
                                                key={type.value}
                                                onClick={() => setOrderType(type.value)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                                                    orderType === type.value
                                                        ? `${type.color} text-white`
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}>
                                                <Icon className="w-3 h-3" />
                                                <span>{type.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Discount Button */}
                            <button
                                onClick={openDiscountModal}
                                className="w-full mb-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-amber-100">
                                <Percent className="w-4 h-4" />
                                {discount.type !== 'none' ? `${discount.type === 'percentage' ? discount.value + '%' : '₱' + discount.value} off` : 'Add Discount'}
                            </button>

                            {/* Totals */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">₱{formatPrice(subtotal)}</span>
                                </div>
                                {employeeDiscount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Employee Discount</span>
                                        <span className="font-medium text-purple-600">-₱{formatPrice(employeeDiscount)}</span>
                                    </div>
                                )}
                                {cardDiscount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Card Discount (20%)</span>
                                        <span className="font-medium text-emerald-600">-₱{formatPrice(cardDiscount)}</span>
                                    </div>
                                )}
                                {additionalDiscount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Additional Discount</span>
                                        <span className="font-medium text-red-500">-₱{formatPrice(additionalDiscount)}</span>
                                    </div>
                                )}
                                {serviceCharge > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Hotel Service Charge (10%)</span>
                                        <span className="font-medium text-amber-600">+₱{formatPrice(serviceCharge)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                                    <span>Total</span>
                                    <span className="text-lg text-blue-600">₱{formatPrice(total)}</span>
                                </div>
                                {modalIsPersonal && (
                                    <div className="flex justify-between text-sm text-pink-600 bg-pink-50 p-2 rounded mt-2">
                                        <span className="font-medium">Personal Order</span>
                                        <span>Will be marked as free</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={clearOrder}
                                    className="py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium flex items-center justify-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    <span>Clear</span>
                                </button>
                                <button 
                                    onClick={openPaymentModal}
                                    className="py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    <span>Pay</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column - Menu */}
                    <div className={`${showPendingOrders ? 'w-[45%]' : 'w-[70%]'} flex flex-col bg-gray-50 transition-all duration-300`}>
                        {/* Search */}
                        <div className="bg-white border-b border-gray-200 p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="bg-white px-4 py-3 border-b border-gray-200 overflow-x-auto">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveCategory('all')}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                                        activeCategory === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}>
                                    All Items
                                </button>
                                {categories.map(category => {
                                    const Icon = categoryIcons[category.name] || ChefHat;
                                    const itemCount = category.items?.length || 0;
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => setActiveCategory(category.id.toString())}
                                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap flex items-center gap-2 ${
                                                activeCategory === category.id.toString()
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}>
                                            <Icon className="w-4 h-4" />
                                            <span>{category.name}</span>
                                            {itemCount > 0 && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                    activeCategory === category.id.toString()
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-300 text-gray-700'
                                                }`}>
                                                    {itemCount}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Menu Items Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No items found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    {filteredItems.map(item => {
                                        const isUnavailable = item.is_available === false;
                                        const lowStock = item.stock_quantity !== null && item.stock_quantity <= 5 && item.stock_quantity > 0;
                                        const outOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;
                                        const imageUrl = getImageUrl(item.image);
                                        const hasSizes = item.sizes && item.sizes.length > 0;
                                        
                                        // Get display price for item
                                        const displayPrice = getItemDisplayPrice(item);
                                        
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => !isUnavailable && !outOfStock && addToOrder(item)}
                                                disabled={isUnavailable || outOfStock}
                                                className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all ${
                                                    isUnavailable || outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'
                                                }`}>
                                                <div className="aspect-square bg-gray-100 relative">
                                                    {imageUrl ? (
                                                        <img 
                                                            src={imageUrl} 
                                                            alt={item.name} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100"><Utensils class="w-8 h-8 text-gray-400" /></div>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <Utensils className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                    {outOfStock && (
                                                        <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">
                                                            Out of Stock
                                                        </span>
                                                    )}
                                                    {lowStock && !outOfStock && (
                                                        <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded">
                                                            Low Stock
                                                        </span>
                                                    )}
                                                    {hasSizes && (
                                                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded flex items-center gap-1">
                                                            <Settings className="w-3 h-3" />
                                                            Sizes
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="p-2">
                                                    <h3 className="font-medium text-gray-900 text-sm truncate">{item.name}</h3>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <p className="text-lg font-bold text-blue-600">₱{displayPrice}</p>
                                                        {item.stock_quantity !== null && (
                                                            <p className="text-xs text-gray-500">Stock: {item.stock_quantity}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Pending Orders */}
                    {showPendingOrders && (
                        <div className="w-[25%] bg-white border-l border-gray-200 flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
                                <h2 className="font-bold text-gray-900">Pending Orders</h2>
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                    {filteredPendingOrders.length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {filteredPendingOrders.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">No pending orders</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredPendingOrders.map((order) => {
                                            const statusBadge = getOrderStatusBadge(order);
                                            const StatusIcon = statusBadge.icon;
                                            const button = getOrderButton(order);
                                            const ButtonIcon = button.icon;
                                            const isHotel = isHotelOrder(order);
                                            const isPersonal = isPersonalOrder(order);
                                            
                                            return (
                                                <div key={order.id} className={`rounded-lg p-3 border ${
                                                    isPersonal 
                                                        ? 'bg-pink-50 border-pink-300' 
                                                        : isHotel 
                                                        ? 'bg-amber-50 border-amber-300' 
                                                        : 'bg-amber-50 border-amber-200'
                                                }`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-gray-900">
                                                                    {order.display_order_number || `ORD-${String(order.id).padStart(5, '0')}`}
                                                                </span>
                                                                {isPersonal && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-200 text-pink-800 rounded-full text-xs font-medium">
                                                                        <Heart className="w-3 h-3" />
                                                                        Personal
                                                                    </span>
                                                                )}
                                                                {isHotel && !isPersonal && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs font-medium">
                                                                        <Building2 className="w-3 h-3" />
                                                                        Hotel
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {order.customer_name && (
                                                                <p className="text-xs text-gray-600 mt-1">{order.customer_name}</p>
                                                            )}
                                                            {isHotel && order.room_number && (
                                                                <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                                                                    <Hash className="w-3 h-3" />
                                                                    <span>Room: {order.room_number}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-amber-600">₱{formatPrice(order.total_amount)}</span>
                                                    </div>
                                                    
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color} mb-2`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        <span>{statusBadge.text}</span>
                                                    </div>
                                                    
                                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                        {order.items_list || 'No items'}
                                                    </p>
                                                    
                                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                        <span>{formatPhilippineTime(order.created_at)}</span>
                                                    </div>
                                                    
                                                    {!button.disabled ? (
                                                        <button
                                                            onClick={() => completeOrder(order.id)}
                                                            disabled={processingOrder === order.id}
                                                            className={`w-full py-1.5 ${button.color} text-white rounded text-sm disabled:opacity-50 flex items-center justify-center gap-1`}>
                                                            {processingOrder === order.id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <ButtonIcon className="w-3 h-3" />
                                                            )}
                                                            {processingOrder === order.id ? 'Processing...' : button.text}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className={`w-full py-1.5 ${button.color} text-white rounded text-sm cursor-not-allowed flex items-center justify-center gap-1 opacity-70`}>
                                                            <ButtonIcon className="w-3 h-3" />
                                                            {button.text}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Payment</h2>
                                <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {/* People & Cards */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>People & Cards</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">People</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <button
                                                onClick={() => setModalPeopleCount(p => Math.max(1, p - 1))}
                                                className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300">
                                                <Minus className="w-4 h-4 mx-auto" />
                                            </button>
                                            <span className="flex-1 text-center font-bold text-lg">{modalPeopleCount}</span>
                                            <button
                                                onClick={() => setModalPeopleCount(p => p + 1)}
                                                className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300">
                                                <Plus className="w-4 h-4 mx-auto" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Cards (20% off each)</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <button
                                                onClick={() => setModalCardsPresented(c => Math.max(0, c - 1))}
                                                className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300">
                                                <Minus className="w-4 h-4 mx-auto" />
                                            </button>
                                            <span className="flex-1 text-center font-bold text-lg">{modalCardsPresented}</span>
                                            <button
                                                onClick={() => setModalCardsPresented(c => Math.min(modalPeopleCount, c + 1))}
                                                className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300">
                                                <Plus className="w-4 h-4 mx-auto" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Employee Toggle with Name Input */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-full">
                                            <Briefcase className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Employee Order</h3>
                                            <p className="text-xs text-gray-600">Check if customer is an employee</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={modalIsEmployee}
                                            onChange={(e) => {
                                                setModalIsEmployee(e.target.checked);
                                                if (e.target.checked) {
                                                    setModalIsPersonal(false);
                                                }
                                            }}
                                        />
                                        <div className={`w-14 h-7 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${
                                            modalIsEmployee ? 'bg-purple-600' : 'bg-gray-300'
                                        }`}></div>
                                        <span className="ml-3 text-sm font-medium text-gray-900">
                                            {modalIsEmployee ? 'Yes' : 'No'}
                                        </span>
                                    </label>
                                </div>
                                
                                {modalIsEmployee && (
                                    <>
                                        <div className="space-y-3 mt-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Employee Name <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={employeeInfo.name}
                                                        onChange={(e) => setEmployeeInfo({...employeeInfo, name: e.target.value})}
                                                        placeholder="Enter employee name"
                                                        className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                            </div>
                                           
                                        </div>
                                        
                                        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                            <p className="text-xs font-medium text-purple-800 mb-2">💼 Employee discounts applied:</p>
                                            <ul className="text-xs text-purple-700 space-y-1">
                                                <li className="flex justify-between">
                                                    <span>• Coffee / Milk / Frappe:</span>
                                                    <span className="font-bold">20% off</span>
                                                </li>
                                                <li className="flex justify-between">
                                                    <span>• All Food items:</span>
                                                    <span className="font-bold">5% off</span>
                                                </li>
                                                <li className="flex justify-between">
                                                    <span>• Soda:</span>
                                                    <span className="font-bold">10% off</span>
                                                </li>
                                                <li className="flex justify-between text-purple-500">
                                                    <span>• Add-ons:</span>
                                                    <span className="font-bold">No discount</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Personal Toggle with Name Input */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border-2 border-pink-200 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-100 rounded-full">
                                            <Heart className="w-5 h-5 text-pink-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Personal Order (Free)</h3>
                                            <p className="text-xs text-gray-600">For owner, family, or complimentary</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={modalIsPersonal}
                                            onChange={(e) => {
                                                setModalIsPersonal(e.target.checked);
                                                if (e.target.checked) {
                                                    setModalIsEmployee(false);
                                                    // Auto-select Personal payment method
                                                    setSelectedPaymentMethod({ id: 5, name: 'Personal' });
                                                }
                                            }}
                                        />
                                        <div className={`w-14 h-7 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${
                                            modalIsPersonal ? 'bg-pink-600' : 'bg-gray-300'
                                        }`}></div>
                                        <span className="ml-3 text-sm font-medium text-gray-900">
                                            {modalIsPersonal ? 'Yes' : 'No'}
                                        </span>
                                    </label>
                                </div>
                                
                                {modalIsPersonal && (
                                    <div className="space-y-3 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Personal Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={personalInfo.name}
                                                    onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
                                                    placeholder="Enter name (owner, family, etc.)"
                                                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                                                />
                                            </div>
                                        </div>
                                        
                                    </div>
                                )}
                            </div>

                            {/* Payment Methods - Hide for Personal orders since it's auto-selected */}
                            {!modalIsPersonal && (
                                <>
                                    <h3 className="font-semibold text-gray-700 mb-3">Payment Method</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {PAYMENT_METHODS.map(method => {
                                            const Icon = method.icon;
                                            const isSelected = selectedPaymentMethod?.id === method.id;
                                            return (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setSelectedPaymentMethod(method)}
                                                    className={`p-4 rounded-lg border-2 transition-all ${
                                                        isSelected
                                                            ? `${method.bgColor} border-${method.color.split('-')[1]}-500`
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}>
                                                    <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? method.textColor : 'text-gray-600'}`} />
                                                    <span className={`text-sm font-medium ${isSelected ? method.textColor : 'text-gray-600'}`}>
                                                        {method.name}
                                                    </span>
                                                    {method.name === 'Hotel' && isSelected && (
                                                        <span className="text-xs text-amber-600 block mt-1">+10% Service Charge</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Order Summary */}
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Order Summary</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>₱{formatPrice(modalTotals.subtotal)}</span>
                                    </div>
                                    {modalTotals.employeeDiscount > 0 && (
                                        <div className="flex justify-between text-purple-600">
                                            <span>Employee Discount</span>
                                            <span>-₱{formatPrice(modalTotals.employeeDiscount)}</span>
                                        </div>
                                    )}
                                    {modalTotals.cardDiscount > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Card Discount</span>
                                            <span>-₱{formatPrice(modalTotals.cardDiscount)}</span>
                                        </div>
                                    )}
                                    {modalTotals.additionalDiscount > 0 && (
                                        <div className="flex justify-between text-red-500">
                                            <span>Additional Discount</span>
                                            <span>-₱{formatPrice(modalTotals.additionalDiscount)}</span>
                                        </div>
                                    )}
                                    {modalTotals.serviceCharge > 0 && (
                                        <div className="flex justify-between text-amber-600">
                                            <span>Hotel Service Charge (10%)</span>
                                            <span>+₱{formatPrice(modalTotals.serviceCharge)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-blue-200 pt-2 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">Total</span>
                                            <span className="text-2xl font-bold text-blue-600">₱{formatPrice(modalTotals.total)}</span>
                                        </div>
                                        {modalIsPersonal && (
                                            <div className="flex justify-between text-sm text-pink-600 mt-1">
                                                <span>Status:</span>
                                                <span className="font-medium">FREE ORDER (Personal)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Cash Input - Only for Cash payment and not personal */}
                            {selectedPaymentMethod?.name === 'Cash' && !modalIsPersonal && (
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Cash Received</label>
                                    <input
                                        type="number"
                                        value={cashAmount}
                                        onChange={(e) => setCashAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                    {cashAmount && Number(cashAmount) >= modalTotals.total && (
                                        <div className="mt-2 text-green-600 font-medium">
                                            Change: ₱{formatPrice(Number(cashAmount) - modalTotals.total)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Hotel Information */}
                            {selectedPaymentMethod?.name === 'Hotel' && !modalIsPersonal && (
                                <div className="mb-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">Guest Name</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={hotelInfo.guestName}
                                                onChange={(e) => setHotelInfo({...hotelInfo, guestName: e.target.value})}
                                                placeholder="Enter guest name"
                                                className="w-full pl-10 pr-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-amber-500"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">Room Number</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={hotelInfo.roomNumber}
                                                onChange={(e) => setHotelInfo({...hotelInfo, roomNumber: e.target.value})}
                                                placeholder="Enter room number"
                                                className="w-full pl-10 pr-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
                                        <p className="font-medium">🏨 Hotel Order</p>
                                        <p className="text-xs mt-1">10% service charge will be applied</p>
                                        <p className="text-xs">Card discounts still apply</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={
                                        isLoading || 
                                        (modalIsEmployee && !employeeInfo.name) ||
                                        (modalIsPersonal && !personalInfo.name) ||
                                        (!modalIsPersonal && !selectedPaymentMethod)
                                    }
                                    className={`flex-1 py-3 rounded-lg font-bold ${
                                        isLoading || 
                                        (modalIsEmployee && !employeeInfo.name) ||
                                        (modalIsPersonal && !personalInfo.name) ||
                                        (!modalIsPersonal && !selectedPaymentMethod)
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : modalIsPersonal
                                            ? 'bg-pink-600 text-white hover:bg-pink-700'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}>
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : modalIsPersonal ? (
                                        'Confirm Free Order'
                                    ) : (
                                        'Confirm Order'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Discount Modal */}
            {showDiscountModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Apply Additional Discount</h2>
                                <button onClick={() => setShowDiscountModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setDiscount({ type: 'percentage', value: 10 })}
                                        className={`py-3 rounded-lg font-medium ${
                                            discount.type === 'percentage' ? 'bg-amber-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                                        }`}>
                                        Percentage %
                                    </button>
                                    <button
                                        onClick={() => setDiscount({ type: 'fixed', value: 50 })}
                                        className={`py-3 rounded-lg font-medium ${
                                            discount.type === 'fixed' ? 'bg-amber-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                                        }`}>
                                        Fixed ₱
                                    </button>
                                </div>
                                
                                {discount.type !== 'none' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {discount.type === 'percentage' ? 'Percentage %' : 'Amount (₱)'}
                                        </label>
                                        <input
                                            type="number"
                                            value={discount.value}
                                            onChange={(e) => setDiscount({...discount, value: Number(e.target.value)})}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                                            min="0"
                                            max={discount.type === 'percentage' ? 100 : undefined}
                                        />
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Note: This discount is applied after employee and card discounts.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => {
                                    setDiscount({ type: 'none', value: 0 });
                                    setShowDiscountModal(false);
                                }}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                                Remove
                            </button>
                            <button
                                onClick={() => setShowDiscountModal(false)}
                                className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Add Note for Item</h2>
                                <button onClick={() => setShowNotesModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                placeholder="e.g., No peanuts, extra spicy, etc."
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows="4"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                This note will appear in the kitchen for the chef.
                            </p>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => setShowNotesModal(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                                Cancel
                            </button>
                            <button
                                onClick={saveItemNote}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
