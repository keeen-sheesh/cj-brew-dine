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
  ChevronsUpDown,
  Maximize,
  Minimize
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isSameDay } from 'date-fns';

export default function Kitchen({ orders = [], hasNewOrder: initialHasNewOrder, stats = {} }) {
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
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Unified confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ show: false, orderId: null, action: null, message: '' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const audioRef = useRef(null);
  const soundSourcesRef = useRef([]);
  const soundSourceIndexRef = useRef(0);
  const pollTimeoutRef = useRef(null);
  const pollInFlightRef = useRef(false);
  const lastPollSinceRef = useRef(Math.floor(Date.now() / 1000));
  const mountedRef = useRef(true);
  const datePickerRef = useRef(null);
  // Track seen order IDs to detect genuinely new orders
  const seenOrderIdsRef = useRef(new Set());
  const notifiedOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

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
    const pathPrefix = window.location.pathname.includes('/admin/')
      ? window.location.pathname.split('/admin/')[0]
      : '';
    const prefixedSource = `${pathPrefix}/sound1.mp3`.replace(/\/{2,}/g, '/');
    soundSourcesRef.current = Array.from(new Set([prefixedSource, '/sound1.mp3']));
    soundSourceIndexRef.current = 0;

    audioRef.current = new Audio(soundSourcesRef.current[soundSourceIndexRef.current]);
    audioRef.current.volume = 0.7;
    audioRef.current.preload = 'auto';
    
    audioRef.current.addEventListener('error', () => {
      const nextSource = soundSourcesRef.current[soundSourceIndexRef.current + 1];
      if (nextSource && audioRef.current) {
        soundSourceIndexRef.current += 1;
        audioRef.current.src = nextSource;
        audioRef.current.load();
        return;
      }

      console.error('Sound file failed to load:', {
        src: audioRef.current?.currentSrc || 'unknown',
        code: audioRef.current?.error?.code,
      });
    });
    
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    
    // Seed seenOrderIdsRef with current order IDs to avoid false positives on first poll
    if (orders && Array.isArray(orders)) {
      const initialOrderIds = orders.map(o => o.id);
      seenOrderIdsRef.current = new Set(initialOrderIds);
      notifiedOrderIdsRef.current = new Set(initialOrderIds);
      console.log('Seeded seen order IDs:', initialOrderIds);
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
    if (!soundEnabled) {
      return;
    }

    if (!audioRef.current) {
      console.warn('Audio element not available');
      return;
    }

    try {
      // Reset and play audio
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Alarm sound played successfully');
          })
          .catch(error => {
            console.warn('Alarm playback failed:', error.message);
            // If audio fails, don't reset audioSystemReady flag
            // User can still use the system and try again
          });
      }
    } catch (error) {
      console.error('Unexpected play error:', error);
    }
  }, [soundEnabled]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  // Track fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Sync seen order IDs when orders prop changes (initial load or date filter change)
  useEffect(() => {
    if (orders && Array.isArray(orders) && orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      // Only seed if the set is empty (first load) to avoid overriding during date filter changes
      if (seenOrderIdsRef.current.size === 0) {
        seenOrderIdsRef.current = new Set(orderIds);
        notifiedOrderIdsRef.current = new Set(orderIds);
        console.log('Initialized seen order IDs from prop:', orderIds);
      }
    }
  }, [orders]);

  // Poll for updates
  const pollForUpdates = useCallback(async () => {
    if (!mountedRef.current || pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    let nextDelayMs = 3000;
    
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/admin/kitchen/check-new?date=${formattedDate}&since=${lastPollSinceRef.current}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        },
      });
      
      if (!mountedRef.current) return;

      if (response.status === 401) {
        setConnectionStatus('disconnected');
        showNotification('Session expired', 'Please login again', 'error');
        mountedRef.current = false;
        window.location.href = '/login';
        return;
      }

      if (response.status === 419) {
        setConnectionStatus('disconnected');
        showNotification('Session refreshed', 'Reloading page...', 'info');
        mountedRef.current = false;
        window.location.reload();
        return;
      }

      if (!response.ok) {
        throw new Error(`Connection failed (${response.status})`);
      }

      const data = await response.json();
      setConnectionStatus('connected');

      // Auto-initialize audio system on first successful connection
      if (!audioSystemReady && audioRef.current) {
        try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setAudioSystemReady(true);
                console.log('Audio system auto-initialized');
              })
              .catch(err => {
                console.log('Audio autoplay blocked by browser policy (normal)', err.message);
              });
          }
        } catch (err) {
          console.log('Audio init attempt:', err.message);
        }
      }

      const nextSinceRaw = Number(data?.timestamp) || Math.floor(Date.now() / 1000);
      lastPollSinceRef.current = nextSinceRaw > 1000000000000
        ? Math.floor(nextSinceRaw / 1000)
        : nextSinceRaw;
      
      if (data.orders) {
        // Get current order IDs from the response
        const currentOrderIds = data.orders.map(o => o.id);
        
        // Find genuinely new orders by checking against previously seen IDs
        const newOrderIds = currentOrderIds.filter(id => !seenOrderIdsRef.current.has(id));
        const unnotifiedNewOrderIds = newOrderIds.filter(
          id => !notifiedOrderIdsRef.current.has(id)
        );
        const hasNewOrders = unnotifiedNewOrderIds.length > 0;
        
        // Update the seen order IDs set
        seenOrderIdsRef.current = new Set(currentOrderIds);
        unnotifiedNewOrderIds.forEach(id => notifiedOrderIdsRef.current.add(id));
        
        setKitchenOrders(data.orders);
        
        // Only show notification if there are truly new orders
        // Skip on first load - don't play sound on initial page load
        if (isFirstLoadRef.current) {
          isFirstLoadRef.current = false;
        } else if (soundEnabled && audioSystemReady && hasNewOrders) {
          console.log('New orders detected, playing alarm:', { unnotifiedNewOrderIds, hasNewOrders });
          playAlarm();
          showNotification(
            '🔔 New Order!',
            unnotifiedNewOrderIds.length > 1
              ? `${unnotifiedNewOrderIds.length} new kitchen orders arrived`
              : 'A new kitchen order has arrived',
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
      setConnectionStatus('disconnected');
      nextDelayMs = 5000;
    } finally {
      pollInFlightRef.current = false;
      if (mountedRef.current) {
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = setTimeout(pollForUpdates, nextDelayMs);
      }
    }
  }, [selectedDate, soundEnabled, audioSystemReady, playAlarm]);

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
    // Clear existing notification before showing new one (prevent stacking)
    if (notification) {
      setNotification(null);
    }
    
    // Use a small delay to ensure the DOM updates
    setTimeout(() => {
      setNotification({ title, message, type });
      setTimeout(() => setNotification(null), 3000);
    }, 50);
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
      document.documentElement.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullScreen(false);
        });
      }
    }
  };

  // Unified function to update order status
  const updateOrderStatus = async (orderId, action) => {
    setProcessingOrder(orderId);
    
    const endpoint = action === 'start' ? 'start' : 'ready';
    const successMessage = action === 'start' 
      ? { title: '✅ Started', message: `Order #${orderId} is now preparing` }
      : { title: '✅ Ready for Pickup', message: `Order #${orderId} is ready for pickup` };
    const newStatus = action === 'start' ? 'preparing' : 'ready';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/admin/kitchen/orders/${orderId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check response status first
      if (!response.ok) {
        if (response.status === 419) {
          showNotification('⚠️ Session Expired', 'Please refresh the page and try again', 'error');
          return;
        }
        throw new Error(`Server error (${response.status})`);
      }
      
      // Only try to parse JSON if response is valid
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse response:', e);
        showNotification('⚠️ Error', 'Invalid server response', 'error');
        return;
      }
      
      if (data.success) {
        setKitchenOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, kitchen_status: newStatus } : order
        ));
        showNotification(successMessage.title, successMessage.message, 'success');
      } else {
        showNotification('⚠️ Error', data.message || 'Failed to update order', 'error');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        showNotification('⏱️ Timeout', 'Request took too long. Please try again.', 'error');
      } else {
        console.error('Error:', error);
        showNotification('❌ Error', 'Failed to update order', 'error');
      }
    } finally {
      setProcessingOrder(null);
      setConfirmModal({ show: false, orderId: null, action: null, message: '' });
    }
  };

  // Request confirmation for order actions
  const requestConfirmation = (orderId, action) => {
    const message = action === 'start' 
      ? `Start preparing order #${orderId}?`
      : `Mark order #${orderId} as READY FOR PICKUP?`;
    
    setConfirmModal({
      show: true,
      orderId,
      action,
      message
    });
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
                  onClick={() => requestConfirmation(order.id, 'start')}
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
                  onClick={() => requestConfirmation(order.id, 'ready')}
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
    <Wrapper>
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
                    Kitchen
                  </h1>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Philippine Time • Auto-refresh every 3 seconds
                  </p>
                </div>
              </div>

              {/* Header-level controls */}
              <div className="flex items-center gap-2">
                <ConnectionStatusBadge />
                <button
                  onClick={() => setShowControlPanel(!showControlPanel)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    showControlPanel
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  Controls
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showControlPanel ? 'rotate-180' : ''}`} />
                </button>
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
            </div>
          </div>

          {/* DASHBOARD CONTROL PANEL */}
          {showControlPanel && (
            <div className="mb-6 flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Audio Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                audioSystemReady
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${audioSystemReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                Audio {audioSystemReady ? 'Ready' : 'Not Ready'}
              </div>

              <div className="w-px h-5 bg-gray-200" />

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  soundEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Sound {soundEnabled ? 'On' : 'Off'}
              </button>

              {/* Test Alarm */}
              <button
                onClick={testAlarm}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Test Alarm
              </button>

              <div className="w-px h-5 bg-gray-200" />

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </div>
          )}

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


        </div>
      </div>

      {/* Unified Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmModal.action === 'start' ? 'Start Preparing' : 'Ready for Pickup'}
                </h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 text-center">
                {confirmModal.message}
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ show: false, orderId: null, action: null, message: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => updateOrderStatus(confirmModal.orderId, confirmModal.action)}
                disabled={processingOrder === confirmModal.orderId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {processingOrder === confirmModal.orderId ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </Wrapper>
  );
}
