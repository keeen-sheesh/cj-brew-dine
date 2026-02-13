import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { 
  Clock, 
  Flame,
  CheckCircle, 
  Bell, 
  RefreshCw,
  Play,
  Check,
  X,
  AlertTriangle,
  Utensils,
  User,
  Timer,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function Kitchen({ orders = [], hasNewOrder, currentTime }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [notification, setNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [kitchenOrders, setKitchenOrders] = useState(Array.isArray(orders) ? orders : []);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());
  const audioRef = useRef(null);

  // Filter orders by status - with safety checks
  const pendingOrders = kitchenOrders.filter(o => o && o.kitchen_status === 'pending');
  const preparingOrders = kitchenOrders.filter(o => o && o.kitchen_status === 'preparing');
  const readyOrders = kitchenOrders.filter(o => o && o.kitchen_status === 'ready');

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sound1.mp3');
    
    // Play sound on new order (first load)
    if (hasNewOrder && soundEnabled) {
      playAlarm();
      showNotification('NEW ORDER!', 'New kitchen order received');
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // REAL-TIME POLLING: Check for new orders every 2 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      checkForNewOrders();
    }, 2000); // 2 seconds - near real-time
    
    return () => clearInterval(pollInterval);
  }, [lastCheckTime]);

  const checkForNewOrders = async () => {
    try {
      const response = await fetch(route('admin.kitchen.check-new'), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      if (data.success && data.has_new_orders && data.new_orders && data.new_orders.length > 0) {
        // Add new orders to the list
        const newOrderIds = data.new_orders.map(order => order.id);
        const existingOrderIds = kitchenOrders.map(order => order.id);
        
        const trulyNewOrders = data.new_orders.filter(order => 
          order && !existingOrderIds.includes(order.id)
        );
        
        if (trulyNewOrders.length > 0) {
          // Add new orders to the beginning
          setKitchenOrders(prev => [...trulyNewOrders, ...prev]);
          setLastCheckTime(Date.now());
          
          // Play sound if enabled
          if (soundEnabled) {
            playAlarm();
            showNotification('NEW ORDER!', `${trulyNewOrders.length} new order(s) received`);
          }
        }
      }
    } catch (error) {
      console.log('Polling error:', error);
    }
  };

  const playAlarm = () => {
    if (!soundEnabled || !audioRef.current) return;
    
    // Play 3 times for attention
    let count = 0;
    const play = () => {
      if (count < 3) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log('Sound error:', e));
        count++;
        setTimeout(play, 700);
      }
    };
    play();
    
    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("New Kitchen Order!", {
        body: "Check the kitchen display",
        icon: "/favicon.ico"
      });
    }
  };

  const showNotification = (title, message) => {
    setNotification({ title, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const closeNotification = () => setNotification(null);

  const testAlarm = () => {
    playAlarm();
    showNotification('Sound Test', 'Testing kitchen alarm system');
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    showNotification(
      soundEnabled ? '🔇 Sound OFF' : '🔊 Sound ON',
      soundEnabled ? 'Notifications disabled' : 'Notifications enabled'
    );
  };

  // Order actions with immediate UI update
  const startPreparing = async (orderId) => {
    if (!confirm(`Start preparing order #${orderId}?`)) return;
    
    // Update UI immediately
    setKitchenOrders(prev => prev.map(order => 
      order && order.id === orderId ? { ...order, kitchen_status: 'preparing' } : order
    ));
    
    try {
      await fetch(route('admin.kitchen.update-status', orderId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ status: 'preparing' })
      });
      
      showNotification('Started', `Order #${orderId} is now preparing`);
    } catch (error) {
      showNotification('Error', 'Failed to update order');
    }
  };

  const markReady = async (orderId) => {
    if (!confirm(`Mark order #${orderId} as ready?`)) return;
    
    setKitchenOrders(prev => prev.map(order => 
      order && order.id === orderId ? { ...order, kitchen_status: 'ready' } : order
    ));
    
    try {
      await fetch(route('admin.kitchen.update-status', orderId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ status: 'ready' })
      });
      
      showNotification('Ready', `Order #${orderId} is ready`);
    } catch (error) {
      showNotification('Error', 'Failed to update order');
    }
  };

  const markComplete = async (orderId) => {
    if (!confirm(`Complete order #${orderId}?`)) return;
    
    // Remove from display
    setKitchenOrders(prev => prev.filter(order => order && order.id !== orderId));
    
    try {
      await fetch(route('admin.kitchen.update-status', orderId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ status: 'completed' })
      });
      
      showNotification('Completed', `Order #${orderId} completed`);
    } catch (error) {
      showNotification('Error', 'Failed to complete order');
    }
  };

  const refreshOrders = () => {
    router.reload({ preserveScroll: true });
    showNotification('Refreshing', 'Loading latest orders...');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'preparing': return <Flame className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const renderOrderCard = (order) => {
    // Safety checks
    if (!order) return null;
    if (!order.items || !Array.isArray(order.items)) {
      order.items = []; // Default to empty array
    }
    
    const isUrgent = order.is_urgent;
    
    return (
      <div key={order.id} className={`mb-4 p-4 rounded-lg border ${getStatusColor(order.kitchen_status)} ${isUrgent ? 'border-red-300 bg-red-50 animate-pulse' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">Order #{order.id}</h3>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/50">
                {order.order_type || 'Takeout'}
              </span>
              {isUrgent && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500 text-white flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> URGENT
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <User className="w-4 h-4" />
              <span>{order.customer_name || 'Walk-in Customer'}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white">
                {getStatusIcon(order.kitchen_status)}
                <span className="font-medium capitalize">{order.kitchen_status || 'pending'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{order.created_at || 'Just now'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {order.kitchen_status === 'pending' && (
              <button
                onClick={() => startPreparing(order.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            )}
            
            {order.kitchen_status === 'preparing' && (
              <button
                onClick={() => markReady(order.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                Ready
              </button>
            )}
            
            {order.kitchen_status === 'ready' && (
              <button
                onClick={() => markComplete(order.id)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </button>
            )}
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Utensils className="w-4 h-4" />
            <span className="font-medium">Items ({order.items.length}):</span>
          </div>
          
          {order.items.length === 0 ? (
            <div className="text-center py-3 text-gray-500">
              No kitchen items
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {order.items.map((item) => (
                <div key={item.id} className="p-2 rounded border bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.quantity || 1}x</span>
                      <span>{item.name || 'Unknown Item'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                        {item.kitchen_status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <Head title="Kitchen Display" />
      
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-6 py-4 bg-yellow-500 text-white rounded-lg shadow-lg flex items-center justify-between max-w-md animate-fade-in">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5" />
            <div>
              <div className="font-bold">{notification.title}</div>
              <div className="text-sm opacity-90">{notification.message}</div>
            </div>
          </div>
          <button onClick={closeNotification} className="p-1 hover:bg-yellow-600 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Control Panel */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Utensils className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kitchen Display</h1>
                    <p className="text-gray-600">Real-time orders • Updates every 2 seconds</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Pending: {pendingOrders.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Preparing: {preparingOrders.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Ready: {readyOrders.length}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSound}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${soundEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'} text-white transition-colors`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {soundEnabled ? 'Sound ON' : 'Sound OFF'}
                </button>
                
                <button
                  onClick={testAlarm}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  Test Sound
                </button>
                
                <button
                  onClick={refreshOrders}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
            >
              <Clock className="w-4 h-4" />
              Pending
              <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">{pendingOrders.length}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('preparing')}
              className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'preparing' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
            >
              <Flame className="w-4 h-4" />
              Preparing
              <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">{preparingOrders.length}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'ready' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
            >
              <CheckCircle className="w-4 h-4" />
              Ready
              <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">{readyOrders.length}</span>
            </button>
          </div>

          {/* Orders Container */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {activeTab === 'pending' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Pending Orders ({pendingOrders.length})</h2>
                  {pendingOrders.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Start preparing ALL pending orders?')) {
                          pendingOrders.forEach(order => order && startPreparing(order.id));
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Start All
                    </button>
                  )}
                </div>
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No pending orders</p>
                    <p className="text-sm text-gray-400">New orders will appear automatically</p>
                  </div>
                ) : (
                  <div>{pendingOrders.map(renderOrderCard)}</div>
                )}
              </div>
            )}
            
            {activeTab === 'preparing' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Preparing Orders ({preparingOrders.length})</h2>
                {preparingOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Flame className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No orders being prepared</p>
                    <p className="text-sm text-gray-400">Start preparing pending orders</p>
                  </div>
                ) : (
                  <div>{preparingOrders.map(renderOrderCard)}</div>
                )}
              </div>
            )}
            
            {activeTab === 'ready' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Ready Orders ({readyOrders.length})</h2>
                {readyOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No ready orders</p>
                    <p className="text-sm text-gray-400">Ready orders will appear here</p>
                  </div>
                ) : (
                  <div>{readyOrders.map(renderOrderCard)}</div>
                )}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Last checked: {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            <p className="text-xs mt-1">Orders update automatically every 2 seconds</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}