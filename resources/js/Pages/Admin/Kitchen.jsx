import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { 
  Clock, 
  CheckCircle, 
  Bell, 
  RefreshCw,
  Play,
  X,
  AlertCircle,
  Utensils,
  Volume2,
  VolumeX,
  ChefHat,
  Coffee,
  Pizza,
  Sandwich,
  Soup,
  Salad,
  Wine,
  Beer,
  GlassWater,
  Calendar,
  Wifi,
  WifiOff,
  AlertOctagon,
  Construction,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
  MessageSquare,
  Maximize2,
  Minimize2,
  Volume1,
  Package,
  CalendarDays,
  ChevronDown,
  Filter,
  CalendarRange,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  ListFilter,
  ChevronsUpDown
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isSameDay } from 'date-fns';

export default function Kitchen({ orders = [], hasNewOrder: initialHasNewOrder }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [notification, setNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioSystemReady, setAudioSystemReady] = useState(false);
  const [kitchenOrders, setKitchenOrders] = useState(Array.isArray(orders) ? orders : []);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    from: new Date(),
    to: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastOrderCount, setLastOrderCount] = useState(orders.length);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const audioRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const datePickerRef = useRef(null);

  // Date filter options
  const dateFilterOptions = [
    { value: 'today', label: 'Today', icon: CalendarCheck },
    { value: 'yesterday', label: 'Yesterday', icon: CalendarX },
    { value: 'this_week', label: 'This Week', icon: CalendarRange },
    { value: 'last_week', label: 'Last Week', icon: CalendarRange },
    { value: 'this_month', label: 'This Month', icon: CalendarClock },
    { value: 'last_month', label: 'Last Month', icon: CalendarClock },
    { value: 'custom', label: 'Custom Range', icon: CalendarDays },
  ];

  // Get date range based on filter
  const getDateRange = (filter) => {
    const now = new Date();
    let from, to;

    switch(filter) {
      case 'today':
        from = now;
        to = now;
        break;
      case 'yesterday':
        from = subDays(now, 1);
        to = subDays(now, 1);
        break;
      case 'this_week':
        from = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        to = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'last_week':
        from = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
        to = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
        break;
      case 'this_month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'last_month':
        from = startOfMonth(subDays(now, 30));
        to = endOfMonth(subDays(now, 30));
        break;
      case 'custom':
        from = customDateRange.from;
        to = customDateRange.to;
        break;
      default:
        from = now;
        to = now;
    }

    return { from, to };
  };

  // Filter orders based on date range
  const filterOrdersByDate = (orders, range) => {
    if (!range.from || !range.to) return orders;
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
      const fromDate = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
      const toDate = new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate());
      
      return orderDateOnly >= fromDate && orderDateOnly <= toDate;
    });
  };

  // Get filtered orders
  const dateRange = getDateRange(dateFilter);
  const filteredKitchenOrders = filterOrdersByDate(kitchenOrders, dateRange);

  // Filter orders by status
  const pendingOrders = filteredKitchenOrders.filter(o => o && o.kitchen_status === 'pending');
  const preparingOrders = filteredKitchenOrders.filter(o => o && o.kitchen_status === 'preparing');
  const readyOrders = filteredKitchenOrders.filter(o => o && o.kitchen_status === 'ready');
  const completedOrders = filteredKitchenOrders.filter(o => o && o.kitchen_status === 'completed');

  // Get current orders based on active tab
  const getCurrentOrders = () => {
    switch(activeTab) {
      case 'pending': return pendingOrders;
      case 'preparing': return preparingOrders;
      case 'ready': return readyOrders;
      case 'completed': return completedOrders;
      default: return [];
    }
  };

  const allOrders = getCurrentOrders();
  const totalPages = Math.ceil(allOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = allOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Reset pagination on tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateFilter]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('/sound1.mp3');
    audioRef.current.volume = 0.7;
    audioRef.current.preload = 'auto';
    
    audioRef.current.addEventListener('error', (e) => {
      console.error('Sound file failed to load:', e);
    });
    
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
      }
    };
  }, []);

  // Initialize audio system (must be called from user gesture)
  const initializeAudioSystem = useCallback(() => {
    if (audioSystemReady || !audioRef.current) return;

    console.log('Initializing audio system via user gesture...');
    
    const playPromise = audioRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setAudioSystemReady(true);
          console.log('Audio system ready.');
          showNotification('🔊 Audio Ready', 'Sound system initialized successfully', 'success');
        })
        .catch(error => {
          console.log('Audio initialization needs a direct user gesture.', error);
        });
    }
  }, [audioSystemReady]);

  // Play alarm function
  const playAlarm = useCallback(() => {
    if (!soundEnabled || !audioSystemReady || !audioRef.current) {
      if (!audioSystemReady && soundEnabled) {
        console.log('Audio not ready. User must click enable button.');
      }
      return;
    }
    
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(error => {
      console.error('Unexpected play error:', error);
      setAudioSystemReady(false);
    });
  }, [soundEnabled, audioSystemReady]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  // Poll for updates
  const pollForUpdates = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/admin/kitchen/check-new?date=${formattedDate}&since=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
        },
      });
      
      if (!mountedRef.current) return;
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('connected');
        
        if (data.orders) {
          const newOrderCount = data.orders.length;
          const oldOrderCount = kitchenOrders.length;
          
          setKitchenOrders(data.orders);
          setLastOrderCount(newOrderCount);
          
          if (soundEnabled && audioSystemReady && newOrderCount > oldOrderCount) {
            playAlarm();
            showNotification('🔔 New Order!', 'A new kitchen order has arrived', 'success');
          }
        }
        
        if (mountedRef.current) {
          pollTimeoutRef.current = setTimeout(pollForUpdates, 3000);
        }
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Polling error:', error);
      setConnectionStatus('disconnected');
      if (mountedRef.current) {
        pollTimeoutRef.current = setTimeout(pollForUpdates, 5000);
      }
    }
  }, [selectedDate, soundEnabled, audioSystemReady, kitchenOrders.length, playAlarm]);

  // Start polling
  useEffect(() => {
    pollForUpdates();
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [pollForUpdates]);

  // Handle filter change
  const handleFilterChange = (filter) => {
    setDateFilter(filter);
    
    if (filter !== 'custom') {
      const range = getDateRange(filter);
      setCustomDateRange(range);
      
      // Show notification
      showNotification('📅 Filter Applied', `Showing ${dateFilterOptions.find(f => f.value === filter)?.label} orders`, 'success');
    }
  };

  // Handle custom date range apply
  const handleCustomRangeApply = () => {
    setDateFilter('custom');
    setShowDatePicker(false);
    showNotification('📅 Custom Range Applied', `${format(customDateRange.from, 'MMM d, yyyy')} - ${format(customDateRange.to, 'MMM d, yyyy')}`, 'success');
  };

  // Format date range for display
  const getDateRangeDisplay = () => {
    if (dateFilter === 'custom') {
      return `${format(customDateRange.from, 'MMM d, yyyy')} - ${format(customDateRange.to, 'MMM d, yyyy')}`;
    }
    return dateFilterOptions.find(f => f.value === dateFilter)?.label;
  };

  const showNotification = (title, message, type = 'info') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const closeNotification = () => setNotification(null);

  const testAlarm = () => {
    initializeAudioSystem();
    if (audioSystemReady) {
      playAlarm();
      showNotification('🔔 Sound Test', 'Testing kitchen alarm system', 'success');
    } else {
      showNotification('👆 Enable Audio', 'Click the "Enable Audio" button first', 'info');
    }
  };

  const toggleSound = () => {
    initializeAudioSystem();
    setSoundEnabled(prev => !prev);
    showNotification(
      !soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF',
      !soundEnabled ? 'New order notifications enabled' : 'New order notifications disabled',
      'info'
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const startPreparing = async (orderId) => {
    if (!confirm(`Start preparing order #${orderId}?`)) return;
    
    setProcessingOrder(orderId);
    
    try {
      const response = await fetch(`/admin/kitchen/orders/${orderId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setKitchenOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, kitchen_status: 'preparing' } : order
        ));
        showNotification('✅ Started', `Order #${orderId} is now preparing`, 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error', 'Failed to start order', 'error');
    } finally {
      setProcessingOrder(null);
    }
  };

  // Mark order as ready for pickup
  const markReady = async (orderId) => {
    if (!confirm(`Mark order #${orderId} as READY FOR PICKUP?`)) return;
    
    setProcessingOrder(orderId);
    
    try {
      const response = await fetch(`/admin/kitchen/orders/${orderId}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setKitchenOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, kitchen_status: 'ready' } : order
        ));
        showNotification('✅ Ready for Pickup', `Order #${orderId} is ready for pickup`, 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error', 'Failed to mark order as ready', 'error');
    } finally {
      setProcessingOrder(null);
    }
  };

  const refreshOrders = () => {
    router.reload({ preserveScroll: true });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': 
        return 'bg-red-600 text-white border-red-700';
      case 'preparing': 
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'ready':
        return 'bg-blue-600 text-white border-blue-700';
      case 'completed': 
        return 'bg-green-600 text-white border-green-700';
      default: 
        return 'bg-gray-600 text-white border-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <AlertOctagon className="w-5 h-5" />;
      case 'preparing': return <Construction className="w-5 h-5" />;
      case 'ready': return <Package className="w-5 h-5" />;
      case 'completed': return <BadgeCheck className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Pending</span>;
      case 'preparing':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Preparing</span>;
      case 'ready':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Ready to Pickup</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getItemIcon = (itemName) => {
    const name = itemName.toLowerCase();
    if (name.includes('coffee')) return <Coffee className="w-4 h-4" />;
    if (name.includes('pizza')) return <Pizza className="w-4 h-4" />;
    if (name.includes('sandwich') || name.includes('burger')) return <Sandwich className="w-4 h-4" />;
    if (name.includes('soup')) return <Soup className="w-4 h-4" />;
    if (name.includes('salad')) return <Salad className="w-4 h-4" />;
    if (name.includes('wine')) return <Wine className="w-4 h-4" />;
    if (name.includes('beer')) return <Beer className="w-4 h-4" />;
    if (name.includes('water') || name.includes('soda')) return <GlassWater className="w-4 h-4" />;
    return <Utensils className="w-4 h-4" />;
  };

  const ConnectionStatusBadge = () => (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
      connectionStatus === 'connected' 
        ? 'text-emerald-600 border-emerald-200 bg-emerald-50' 
        : 'text-red-600 border-red-200 bg-red-50'
    }`}>
      {connectionStatus === 'connected' ? (
        <Wifi className="w-3.5 h-3.5" />
      ) : (
        <WifiOff className="w-3.5 h-3.5" />
      )}
      <span className="text-sm font-medium">{connectionStatus === 'connected' ? 'Live' : 'Offline'}</span>
    </div>
  );

  // Format time to Philippine time
  const formatPHTime = (timeString) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-PH', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
      });
    } catch {
      return timeString;
    }
  };

  // Check if order is hotel
  const isHotelOrder = (order) => {
    return order?.payment_method_name === 'Hotel' || order?.is_hotel === true;
  };

  const OrderCard = ({ order }) => {
    if (!order) return null;
    if (!order.items || !Array.isArray(order.items)) {
      order.items = [];
    }
    
    return (
      <div 
        className={`bg-white rounded-xl shadow-md overflow-hidden border-2 transition-all hover:shadow-lg ${
          order.kitchen_status === 'pending' ? 'border-red-400' :
          order.kitchen_status === 'preparing' ? 'border-yellow-400' :
          order.kitchen_status === 'ready' ? 'border-blue-400' :
          order.kitchen_status === 'completed' ? 'border-green-400' :
          'border-gray-200'
        }`}
      >
        <div className={`p-4 ${getStatusColor(order.kitchen_status)}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-bold text-lg text-white">
                  {order.order_number}
                </h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/20 text-white capitalize">
                  {order.order_type?.replace('_', ' ') || 'Takeout'}
                </span>
                {isHotelOrder(order) && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500 text-white flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    HOTEL
                  </span>
                )}
              </div>
              
              {isHotelOrder(order) && order.room_number && (
                <div className="mb-2 text-white/90 text-sm">
                  🏨 Room: {order.room_number}
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white">
                  {getStatusIcon(order.kitchen_status)}
                  <span className="font-medium capitalize">
                    {order.kitchen_status === 'ready' ? 'Ready to Pickup' : order.kitchen_status}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-white/80">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatPHTime(order.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-row sm:flex-col gap-3">
              {order.kitchen_status === 'pending' && (
                <button
                  onClick={() => startPreparing(order.id)}
                  disabled={processingOrder === order.id}
                  className="px-6 py-3 bg-white text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2 transition-all disabled:opacity-50 shadow-md font-bold border-2 border-red-600 text-base hover:scale-105 active:scale-95"
                >
                  {processingOrder === order.id ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  START
                </button>
              )}
              
              {order.kitchen_status === 'preparing' && (
                <button
                  onClick={() => markReady(order.id)}
                  disabled={processingOrder === order.id}
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-2 transition-all disabled:opacity-50 shadow-md font-bold border-2 border-blue-600 text-base hover:scale-105 active:scale-95"
                >
                  {processingOrder === order.id ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Package className="w-5 h-5" />
                  )}
                  READY TO PICKUP
                </button>
              )}
              
              {order.kitchen_status === 'ready' && (
                <button
                  disabled
                  className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-2 cursor-not-allowed opacity-90 border-2 border-blue-600 font-bold text-base shadow-md"
                >
                  <Package className="w-5 h-5" />
                  READY ✓
                </button>
              )}
              
              {order.kitchen_status === 'completed' && (
                <button
                  disabled
                  className="px-6 py-3 bg-gray-200 text-green-700 rounded-lg flex items-center gap-2 cursor-not-allowed opacity-90 border-2 border-green-600 font-bold text-base shadow-md"
                >
                  <CheckCircle className="w-5 h-5" />
                  DONE ✓
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <ChefHat className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">
              Items ({order.items.length})
            </span>
          </div>
          
          {order.items.length === 0 ? (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
              No kitchen items
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {order.items.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded-lg border ${
                    item.kitchen_status === 'completed' 
                      ? 'bg-green-50 border-green-200' 
                      : item.kitchen_status === 'preparing'
                      ? 'bg-yellow-50 border-yellow-200'
                      : item.kitchen_status === 'ready'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white rounded-lg">
                      {getItemIcon(item.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {item.quantity}x {item.name}
                        </span>
                        {getStatusBadge(item.kitchen_status)}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-amber-600 mt-1 italic flex items-center gap-1 bg-amber-50 p-1 rounded">
                          <MessageSquare className="w-3 h-3" />
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {order.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
              <span className="font-medium">Order Notes:</span> {order.notes}
            </div>
          )}
        </div>
      </div>
    );
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span>Showing</span>
          <span className="font-medium">{indexOfFirstOrder + 1}</span>
          <span>to</span>
          <span className="font-medium">
            {Math.min(indexOfLastOrder, allOrders.length)}
          </span>
          <span>of</span>
          <span className="font-medium">{allOrders.length}</span>
          <span>orders</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
            {currentPage}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <Head title="Kitchen Display" />
      
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center justify-between max-w-md animate-slide-in ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-yellow-600'
        } text-white`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            <div>
              <div className="font-bold">{notification.title}</div>
              <div className="text-sm opacity-90">{notification.message}</div>
            </div>
          </div>
          <button onClick={closeNotification} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl shadow-lg">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Kitchen Display System
                  </h1>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Philippine Time • Auto-refresh every 3 seconds
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <ConnectionStatusBadge />
                
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium">{pendingOrders.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs font-medium">{preparingOrders.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium">{readyOrders.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium">{completedOrders.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* DATE FILTER DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{getDateRangeDisplay()}</span>
                  <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                </button>

                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[300px]">
                    <div className="space-y-2">
                      {dateFilterOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              handleFilterChange(option.value);
                              if (option.value !== 'custom') {
                                setShowDatePicker(false);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              dateFilter === option.value
                                ? 'bg-blue-50 text-blue-600'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium flex-1 text-left">{option.label}</span>
                            {dateFilter === option.value && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CUSTOM DATE RANGE PICKER */}
              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {format(customDateRange.from, 'MMM d, yyyy')}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm text-gray-700">
                      {format(customDateRange.to, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="relative">
                    <DatePicker
                      selected={customDateRange.from}
                      onChange={(date) => {
                        if (date) {
                          setCustomDateRange({
                            from: date,
                            to: customDateRange.to
                          });
                        }
                      }}
                      selectsStart
                      startDate={customDateRange.from}
                      endDate={customDateRange.to}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <DatePicker
                      selected={customDateRange.to}
                      onChange={(date) => {
                        if (date) {
                          setCustomDateRange({
                            from: customDateRange.from,
                            to: date
                          });
                        }
                      }}
                      selectsEnd
                      startDate={customDateRange.from}
                      endDate={customDateRange.to}
                      minDate={customDateRange.from}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}

              {/* QUICK FILTER BADGES */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFilterChange('today')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    dateFilter === 'today'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => handleFilterChange('this_week')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    dateFilter === 'this_week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => handleFilterChange('this_month')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    dateFilter === 'this_month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Month
                </button>
              </div>

              {/* Enable Audio Button */}
              <button
                onClick={initializeAudioSystem}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm border transition-all ${
                  audioSystemReady 
                    ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' 
                    : 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 animate-pulse'
                }`}
                title={audioSystemReady ? "Audio system ready" : "Click to enable sounds"}
              >
                <Volume1 className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {audioSystemReady ? 'Audio Ready' : 'Enable Audio'}
                </span>
              </button>

              <button
                onClick={toggleSound}
                className={`p-2 rounded-lg ${
                  soundEnabled 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
                title={soundEnabled ? "Sound On" : "Sound Off"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={testAlarm}
                className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                title="Test Alarm"
              >
                <Bell className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                title="Fullscreen"
              >
                {document.fullscreenElement ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={refreshOrders}
                disabled={processingOrder !== null}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${processingOrder ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* CUSTOM TAB NAVIGATION */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'pending' 
                    ? 'border-red-600 text-red-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <AlertOctagon className="w-4 h-4" />
                Pending
                {pendingOrders.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('preparing')}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'preparing' 
                    ? 'border-yellow-600 text-yellow-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Construction className="w-4 h-4" />
                Preparing
                {preparingOrders.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    {preparingOrders.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('ready')}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'ready' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4" />
                Ready
                {readyOrders.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                    {readyOrders.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'completed' 
                    ? 'border-green-600 text-green-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <BadgeCheck className="w-4 h-4" />
                Completed
                {completedOrders.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                    {completedOrders.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* CONTENT SECTIONS */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            {activeTab === 'pending' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-red-500" />
                      Pending Orders
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {getDateRangeDisplay()} • {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {pendingOrders.length > 0 && dateFilter === 'today' && (
                    <button
                      onClick={() => {
                        if (confirm('Start preparing ALL pending orders?')) {
                          pendingOrders.forEach(order => order && startPreparing(order.id));
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Play className="w-4 h-4" />
                      Start All ({pendingOrders.length})
                    </button>
                  )}
                </div>
                
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 bg-red-100 rounded-full mb-4">
                      <AlertOctagon className="w-12 h-12 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending orders</h3>
                    <p className="text-gray-500">
                      {dateFilter === 'today' 
                        ? 'New kitchen orders will appear here automatically'
                        : `No pending orders for ${getDateRangeDisplay()}`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {currentOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                    <Pagination />
                  </>
                )}
              </div>
            )}

            {activeTab === 'preparing' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Construction className="w-5 h-5 text-yellow-500" />
                    Preparing Orders
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {getDateRangeDisplay()} • {preparingOrders.length} order{preparingOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {preparingOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-4">
                      <Construction className="w-12 h-12 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders being prepared</h3>
                    <p className="text-gray-500">
                      {dateFilter === 'today'
                        ? 'Start preparing pending orders to see them here'
                        : `No preparing orders for ${getDateRangeDisplay()}`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {currentOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                    <Pagination />
                  </>
                )}
              </div>
            )}

            {activeTab === 'ready' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    Ready to Pickup Orders
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {getDateRangeDisplay()} • {readyOrders.length} order{readyOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {readyOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                      <Package className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No ready orders</h3>
                    <p className="text-gray-500">
                      {dateFilter === 'today'
                        ? 'Orders marked as ready will appear here'
                        : `No ready orders for ${getDateRangeDisplay()}`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {currentOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                    <Pagination />
                  </>
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-green-500" />
                    Completed Orders
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {getDateRangeDisplay()} • {completedOrders.length} order{completedOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {completedOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                      <BadgeCheck className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No completed orders</h3>
                    <p className="text-gray-500">
                      {dateFilter === 'today'
                        ? 'Completed orders will appear here'
                        : `No completed orders for ${getDateRangeDisplay()}`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {currentOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                    <Pagination />
                  </>
                )}
              </div>
            )}
          </div>

          {/* STATS CARDS */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredKitchenOrders.length}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <Utensils className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-red-600">{pendingOrders.length}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertOctagon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{preparingOrders.length}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Construction className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ready</p>
                  <p className="text-2xl font-bold text-blue-600">{readyOrders.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <BadgeCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-600">Current Filter:</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                  {getDateRangeDisplay()}
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Orders
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </AdminLayout>
  );
}