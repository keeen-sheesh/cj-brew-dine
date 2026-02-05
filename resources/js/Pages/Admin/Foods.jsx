import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  Tag, Utensils, Calendar, CheckCircle, XCircle, 
  Plus, Edit, Trash2, Search, Filter, SortAsc, 
  ChevronRight, Folder, DollarSign, AlertTriangle,
  Save, X, Eye, EyeOff, ArrowUpDown, Package
} from 'lucide-react';

export default function Foods({ 
    categories: initialCategories = [], 
    items: initialItems = [], 
    total_categories, 
    total_items, 
    active_categories, 
    available_items 
}) {
    const { props } = usePage();
    const [currentTab, setCurrentTab] = useState('categories');
    const [categories, setCategories] = useState(initialCategories);
    const [items, setItems] = useState(initialItems);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [sortBy, setSortBy] = useState('name');
    
    // Modal states
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // Form states
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [newItem, setNewItem] = useState({ 
        name: '', 
        description: '', 
        price: '', 
        category_id: '',
        stock_quantity: 0,
        low_stock_threshold: 10
    });
    const [editCategory, setEditCategory] = useState({ id: '', name: '', description: '' });
    const [editItem, setEditItem] = useState({ 
        id: '', 
        name: '', 
        description: '', 
        price: '', 
        category_id: '',
        stock_quantity: 0,
        low_stock_threshold: 10
    });
    const [deleteTarget, setDeleteTarget] = useState({ type: '', id: '', name: '' });
    
    // Notification state
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const notificationTimeoutRef = useRef(null);
    
    // Loading states
    const [loading, setLoading] = useState({ type: '', id: '' });
    
    // Stats state
    const [stats, setStats] = useState({
        total_categories: total_categories || 0,
        total_items: total_items || 0,
        active_categories: active_categories || 0,
        available_items: available_items || 0
    });
    
    // Filtered and sorted items
    const filteredItems = items.filter(item => {
        const matchesSearch = !searchTerm || 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            item.category_name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = !filterCategory || item.category_id == filterCategory;
        
        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'price_low':
                return parseFloat(a.price) - parseFloat(b.price);
            case 'price_high':
                return parseFloat(b.price) - parseFloat(a.price);
            case 'category':
                return a.category_name.localeCompare(b.category_name);
            default:
                return 0;
        }
    });
    
    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        
        notificationTimeoutRef.current = setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 5000);
    };
    
    // Close notification
    const closeNotification = () => {
        setNotification({ show: false, message: '', type: 'success' });
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
    };
    
    // Format price
    const formatPrice = (price) => {
        return `₱${parseFloat(price).toFixed(2)}`;
    };
    
    // SIMPLE AJAX request helper that ALWAYS works
    const makeRequest = async (url, method = 'POST', data = {}) => {
        try {
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            
            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page.');
            }
            
            // For PUT and DELETE, use POST with _method parameter
            const actualMethod = method.toUpperCase();
            const isFormMethod = ['PUT', 'DELETE', 'PATCH'].includes(actualMethod);
            
            const requestUrl = url;
            const requestMethod = isFormMethod ? 'POST' : actualMethod;
            
            // Create form data
            const formData = new FormData();
            
            // Add _method for Laravel method spoofing if needed
            if (isFormMethod) {
                formData.append('_method', actualMethod);
            }
            
            // Add all data to formData
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key]);
                }
            });
            
            const response = await fetch(requestUrl, {
                method: requestMethod,
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                credentials: 'same-origin', // Important for sessions
                body: method === 'GET' ? undefined : formData,
            });
            
            if (response.status === 419) {
                // CSRF token mismatch - session might have expired
                showNotification('Your session has expired. Please refresh the page and try again.', 'error');
                throw new Error('Session expired (419 CSRF token mismatch)');
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('Request failed:', error);
            showNotification(error.message || 'Request failed', 'error');
            throw error;
        }
    };
    
    // Toggle category status
    const toggleCategoryStatus = async (category) => {
        setLoading({ type: 'category-toggle', id: category.id });
        try {
            const response = await makeRequest(`/admin/food-categories/${category.id}/toggle-status`, 'POST');
            
            if (response.success) {
                setCategories(prev => prev.map(cat => 
                    cat.id === category.id ? { ...cat, is_active: response.is_active } : cat
                ));
                
                if (response.stats) {
                    setStats(response.stats);
                }
                
                showNotification('Category status updated successfully');
            }
        } catch (error) {
            // Error handled in makeRequest
        } finally {
            setLoading({ type: '', id: '' });
        }
    };
    
    // Toggle item status
    const toggleItemStatus = async (item) => {
        setLoading({ type: 'item-toggle', id: item.id });
        try {
            const response = await makeRequest(`/admin/food-items/${item.id}/toggle-status`, 'POST');
            
            if (response.success) {
                setItems(prev => prev.map(it => 
                    it.id === item.id ? { ...it, is_available: response.is_available } : it
                ));
                
                if (response.stats) {
                    setStats(response.stats);
                }
                
                showNotification('Item status updated successfully');
            }
        } catch (error) {
            // Error handled in makeRequest
        } finally {
            setLoading({ type: '', id: '' });
        }
    };
    
    // Add category
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.name.trim()) {
            showNotification('Category name is required', 'error');
            return;
        }
        
        setLoading({ type: 'add-category', id: '' });
        try {
            const response = await makeRequest('/admin/food-categories', 'POST', {
                name: newCategory.name.trim(),
                description: newCategory.description || ''
            });
            
            if (response.success) {
                setCategories(prev => [...prev, response.category]);
                
                if (response.stats) {
                    setStats(response.stats);
                }
                
                showNotification('Category added successfully');
                setNewCategory({ name: '', description: '' });
                setShowAddCategoryModal(false);
            }
        } catch (error) {
            // Error handled in makeRequest
        } finally {
            setLoading({ type: '', id: '' });
        }
    };
    
    // Add item
    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.name.trim() || !newItem.price || !newItem.category_id) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        setLoading({ type: 'add-item', id: '' });
        try {
            const itemData = {
                name: newItem.name.trim(),
                description: newItem.description || '',
                price: parseFloat(newItem.price),
                category_id: newItem.category_id,
                stock_quantity: parseInt(newItem.stock_quantity) || 0,
                low_stock_threshold: parseInt(newItem.low_stock_threshold) || 10,
                is_available: true,
                is_featured: false
            };
            
            const response = await makeRequest('/admin/food-items', 'POST', itemData);
            
            if (response.success) {
                setItems(prev => [...prev, response.item]);
                
                if (response.stats) {
                    setStats(response.stats);
                }
                
                showNotification('Item added successfully');
                setNewItem({ 
                    name: '', 
                    description: '', 
                    price: '', 
                    category_id: '',
                    stock_quantity: 0,
                    low_stock_threshold: 10
                });
                setShowAddItemModal(false);
            }
        } catch (error) {
            // Error handled in makeRequest
        } finally {
            setLoading({ type: '', id: '' });
        }
    };
    
    // Update category
    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!editCategory.name.trim()) {
            showNotification('Category name is required', 'error');
            return;
        }
        
        setLoading({ type: 'update-category', id: editCategory.id });
        try {
            const response = await makeRequest(`/admin/food-categories/${editCategory.id}`, 'PUT', {
                name: editCategory.name.trim(),
                description: editCategory.description || ''
            });
            
            if (response.success) {
                setCategories(prev => prev.map(cat => 
                    cat.id === editCategory.id ? { ...cat, name: editCategory.name, description: editCategory.description } : cat
                ));
                
                showNotification('Category updated successfully');
                setShowEditCategoryModal(false);
                setEditCategory({ id: '', name: '', description: '' });
            }
        } catch (error) {
            // Error handled in makeRequest
        } finally {
            setLoading({ type: '', id: '' });
        }
    };
    
    // Update item
    const handleUpdateItem = async (e) => {
        e.preventDefault();
        if (!editItem.name.trim() || !editItem.price || !editItem.category_id) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        setLoading({ type: 'update-item', id: editItem.id });
        try {
            const itemData = {
                name: editItem.name.trim(),
                description: editItem.description || '',
                price: parseFloat(editItem.price),
                category_id: editItem.category_id,
                stock_quantity: parseInt(editItem.stock_quantity) || 0,
                low_stock_threshold: parseInt(editItem.low_stock_threshold) || 10
            };
            
            const response = await makeRequest(`/admin/food-items/${editItem.id}`, 'PUT', itemData);
            
            if (response.success) {
                setItems(prev => prev.map(it => 
                    it.id === editItem.id ? { 
                        ...it, 
                        name: editItem.name, 
                        description: editItem.description,
                        price: editItem.price,
                        category_id: editItem.category_id,
                        stock_quantity: editItem.stock_quantity,
                        low_stock_threshold: editItem.low_stock_threshold
                    } : it
                ));
                
                showNotification('Item updated successfully');
                setShowEditItemModal(false);
                setEditItem({ 
                    id: '', 
                    name: '', 
                    description: '', 
                    price: '', 
                    category_id: '',
                    stock_quantity: 0,
                    low_stock_threshold: 10
                });
            }
        } catch (error) {
            // Error handled in makeRequest
        } finally {
            setLoading({ type: '', id: '' });
        }
    };
    
    // Delete category
    const handleDeleteCategory = async (id) => {
        setLoading({ type: 'delete-category', id });
        try {
            const response = await makeRequest(`/admin/food-categories/${id}`, 'DELETE');
            
            if (response.success) {
                setCategories(prev => prev.filter(cat => cat.id != id));
                setItems(prev => prev.filter(item => item.category_id != id));
                
                if (response.stats) {
                    setStats(response.stats);
                }
                
                showNotification('Category deleted successfully');
                setShowDeleteModal(false);
                setDeleteTarget({ type: '', id: '', name: '' });
            }
        } catch (error) {
            // Error handled in makeRequest
        } finally {
            setLoading({ type: '', id: '' });
        }
    };
    
    // Delete item
    const handleDeleteItem = async (id) => {
        setLoading({ type: 'delete-item', id });
        try {
            const response = await makeRequest(`/admin/food-items/${id}`, 'DELETE');
            
            if (response.success) {
                setItems(prev => prev.filter(item => item.id != id));
                
                if (response.stats) {
                    setStats(response.stats);
                }
                
                showNotification('Item deleted successfully');
                setShowDeleteModal(false);
                setDeleteTarget({ type: '', id: '', name: '' });
            }
        } catch (error) {
            // Error handled in makeRequest
        } finally {
            setLoading({ type: '', id: '' });
        }
    };
    
    // Delete category/item
    const handleDelete = async () => {
        if (deleteTarget.type === 'category') {
            await handleDeleteCategory(deleteTarget.id);
        } else {
            await handleDeleteItem(deleteTarget.id);
        }
    };
    
    // Open edit modals
    const openEditCategoryModal = (category) => {
        setEditCategory({
            id: category.id,
            name: category.name,
            description: category.description || ''
        });
        setShowEditCategoryModal(true);
    };
    
    const openEditItemModal = (item) => {
        setEditItem({
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: item.price,
            category_id: item.category_id,
            stock_quantity: item.stock_quantity || 0,
            low_stock_threshold: item.low_stock_threshold || 10
        });
        setShowEditItemModal(true);
    };
    
    // Open delete modal
    const openDeleteModal = (type, id, name) => {
        setDeleteTarget({ type, id, name });
        setShowDeleteModal(true);
    };
    
    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, []);
    
    // Get current date
    const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Add a refresh button to handle session issues
    const handleRefresh = () => {
        window.location.reload();
    };
    
    return (
        <AdminLayout>
            <Head title="Food Menu Management" />
            
            {/* Notification */}
            {notification.show && (
                <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-in">
                    <div className={`p-4 rounded-lg shadow-lg border-l-4 ${
                        notification.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                            : 'bg-rose-50 border-rose-500 text-rose-800'
                    }`}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                {notification.type === 'success' ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-rose-500" />
                                )}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium">{notification.message}</p>
                            </div>
                            <button 
                                onClick={closeNotification}
                                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Session Expired Warning */}
            <div className="fixed bottom-4 right-4 z-40">
                <button 
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors text-sm hidden"
                    id="refresh-btn"
                >
                    Refresh Page
                </button>
            </div>
            
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-amber-100 rounded-lg mr-3">
                                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>?
                                {deleteTarget.type === 'category' && ' All items in this category will also be removed.'}
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    disabled={loading.type.includes('delete')}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center disabled:opacity-50"
                                    disabled={loading.type.includes('delete')}
                                >
                                    {loading.type === 'delete-category' && loading.id === deleteTarget.id ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Deleting...
                                        </>
                                    ) : loading.type === 'delete-item' && loading.id === deleteTarget.id ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main Content */}
            <div className="p-6">
                {/* Header with Refresh Button */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4">
                        <div>
                            <div className="flex items-center mb-2">
                                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl mr-3">
                                    <Utensils className="h-6 w-6 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">Food Menu Management</h1>
                            </div>
                            <p className="text-gray-600 ml-11">Manage categories and menu items</p>
                        </div>
                        <div className="mt-4 lg:mt-0 flex items-center space-x-2">
                            <div className="bg-gray-50 px-4 py-2 rounded-lg flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600">{currentDate}</span>
                            </div>
                            <button 
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center"
                                title="Refresh page to fix session issues"
                            >
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-700 mb-1">Categories</p>
                                    <div className="flex items-baseline">
                                        <span className="text-3xl font-bold text-gray-900">{stats.total_categories}</span>
                                        <span className="text-sm text-gray-500 ml-2">total</span>
                                    </div>
                                    <div className="flex items-center mt-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                        <span className="text-sm font-medium text-gray-700">{stats.active_categories}</span>
                                        <span className="text-sm text-gray-500 ml-1">active</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-white/50 rounded-xl">
                                    <Tag className="h-8 w-8 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-700 mb-1">Menu Items</p>
                                    <div className="flex items-baseline">
                                        <span className="text-3xl font-bold text-gray-900">{stats.total_items}</span>
                                        <span className="text-sm text-gray-500 ml-2">total</span>
                                    </div>
                                    <div className="flex items-center mt-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                        <span className="text-sm font-medium text-gray-700">{stats.available_items}</span>
                                        <span className="text-sm text-gray-500 ml-1">available</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-white/50 rounded-xl">
                                    <Package className="h-8 w-8 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="mb-6">
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setCurrentTab('categories')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center ${
                                currentTab === 'categories'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Tag className="h-4 w-4 mr-2" />
                            Categories
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                                {stats.total_categories}
                            </span>
                        </button>
                        <button
                            onClick={() => setCurrentTab('items')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center ${
                                currentTab === 'items'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Utensils className="h-4 w-4 mr-2" />
                            Menu Items
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                                {stats.total_items}
                            </span>
                        </button>
                    </div>
                </div>
                
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                    {currentTab === 'categories' ? (
                                        <Tag className="h-5 w-5 mr-2 text-blue-600" />
                                    ) : (
                                        <Utensils className="h-5 w-5 mr-2 text-emerald-600" />
                                    )}
                                    {currentTab === 'categories' ? 'Food Categories' : 'Menu Items'}
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    {currentTab === 'categories' 
                                        ? 'Organize your menu into logical categories' 
                                        : 'Manage all food and drink items in your menu'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={() => currentTab === 'categories' ? setShowAddCategoryModal(true) : setShowAddItemModal(true)}
                                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm hover:shadow flex items-center whitespace-nowrap"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {currentTab === 'categories' ? 'New Category' : 'New Item'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-6">
                        {/* Search & Filter for Items */}
                        {currentTab === 'items' && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Search */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                            <Search className="h-4 w-4 mr-1 text-gray-400" />
                                            Search Items
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search by name, category, or description..."
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Category Filter */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                            <Filter className="h-4 w-4 mr-1 text-gray-400" />
                                            Filter by Category
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={filterCategory}
                                                onChange={(e) => setFilterCategory(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                            >
                                                <option value="">All Categories</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 h-4 w-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    
                                    {/* Sort */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                            <SortAsc className="h-4 w-4 mr-1 text-gray-400" />
                                            Sort by
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                            >
                                                <option value="name">Name (A-Z)</option>
                                                <option value="price_low">Price (Low to High)</option>
                                                <option value="price_high">Price (High to Low)</option>
                                                <option value="category">Category</option>
                                            </select>
                                            <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Categories Table */}
                        {currentTab === 'categories' && (
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Category Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {categories.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center text-gray-400">
                                                        <Tag className="h-12 w-12 mb-3 opacity-50" />
                                                        <h3 className="text-lg font-medium text-gray-500 mb-1">No Categories Yet</h3>
                                                        <p className="text-gray-400">Create your first category to organize your menu</p>
                                                        <button
                                                            onClick={() => setShowAddCategoryModal(true)}
                                                            className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Create Category
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            categories.map((category, index) => (
                                                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-800 rounded-lg">
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                                                <Tag className="h-4 w-4 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{category.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-xs">
                                                            {category.description ? (
                                                                <p className="text-gray-600 text-sm">{category.description}</p>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm italic">No description</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => toggleCategoryStatus(category)}
                                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                                                category.is_active
                                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                                            }`}
                                                            disabled={loading.type === 'category-toggle' && loading.id === category.id}
                                                        >
                                                            {loading.type === 'category-toggle' && loading.id === category.id ? (
                                                                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
                                                            ) : category.is_active ? (
                                                                <CheckCircle className="h-3 w-3 mr-1.5" />
                                                            ) : (
                                                                <XCircle className="h-3 w-3 mr-1.5" />
                                                            )}
                                                            {loading.type === 'category-toggle' && loading.id === category.id ? (
                                                                'Updating...'
                                                            ) : category.is_active ? (
                                                                'Active'
                                                            ) : (
                                                                'Inactive'
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => openEditCategoryModal(category)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                                disabled={loading.type === 'category-toggle' && loading.id === category.id}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleCategoryStatus(category)}
                                                                className={`p-2 rounded-lg transition-colors ${
                                                                    category.is_active
                                                                        ? 'text-amber-600 hover:bg-amber-50'
                                                                        : 'text-emerald-600 hover:bg-emerald-50'
                                                                }`}
                                                                title={category.is_active ? 'Deactivate' : 'Activate'}
                                                                disabled={loading.type === 'category-toggle' && loading.id === category.id}
                                                            >
                                                                {loading.type === 'category-toggle' && loading.id === category.id ? (
                                                                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                                ) : category.is_active ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal('category', category.id, category.name)}
                                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                                disabled={loading.type === 'category-toggle' && loading.id === category.id}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        {/* Items Table */}
                        {currentTab === 'items' && (
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Item Details
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Price
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {filteredItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center text-gray-400">
                                                        <Utensils className="h-12 w-12 mb-3 opacity-50" />
                                                        <h3 className="text-lg font-medium text-gray-500 mb-1">
                                                            {items.length === 0 ? 'No Menu Items Yet' : 'No Items Found'}
                                                        </h3>
                                                        <p className="text-gray-400">
                                                            {items.length === 0 
                                                                ? 'Start by adding your first menu item' 
                                                                : 'Try adjusting your search or filter criteria'
                                                            }
                                                        </p>
                                                        <button
                                                            onClick={() => setShowAddItemModal(true)}
                                                            className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add Item
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredItems.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-800 rounded-lg">
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-gray-900 flex items-center">
                                                                <Utensils className="h-4 w-4 mr-2 text-gray-400" />
                                                                {item.name}
                                                            </div>
                                                            {item.description && (
                                                                <p className="text-gray-500 text-sm mt-1 max-w-md">
                                                                    {item.description.length > 60 
                                                                        ? item.description.substring(0, 60) + '...'
                                                                        : item.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                                            <Folder className="h-3 w-3 mr-1.5" />
                                                            {item.category_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center font-semibold text-gray-900">
                                                            <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                                                            {formatPrice(item.price)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => toggleItemStatus(item)}
                                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                                                item.is_available
                                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                                            }`}
                                                            disabled={loading.type === 'item-toggle' && loading.id === item.id}
                                                        >
                                                            {loading.type === 'item-toggle' && loading.id === item.id ? (
                                                                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
                                                            ) : item.is_available ? (
                                                                <CheckCircle className="h-3 w-3 mr-1.5" />
                                                            ) : (
                                                                <XCircle className="h-3 w-3 mr-1.5" />
                                                            )}
                                                            {loading.type === 'item-toggle' && loading.id === item.id ? (
                                                                'Updating...'
                                                            ) : item.is_available ? (
                                                                'Available'
                                                            ) : (
                                                                'Unavailable'
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => openEditItemModal(item)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                                disabled={loading.type === 'item-toggle' && loading.id === item.id}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleItemStatus(item)}
                                                                className={`p-2 rounded-lg transition-colors ${
                                                                    item.is_available
                                                                        ? 'text-amber-600 hover:bg-amber-50'
                                                                        : 'text-emerald-600 hover:bg-emerald-50'
                                                                }`}
                                                                title={item.is_available ? 'Make Unavailable' : 'Make Available'}
                                                                disabled={loading.type === 'item-toggle' && loading.id === item.id}
                                                            >
                                                                {loading.type === 'item-toggle' && loading.id === item.id ? (
                                                                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                                ) : item.is_available ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal('item', item.id, item.name)}
                                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                                disabled={loading.type === 'item-toggle' && loading.id === item.id}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Modals - Keep your existing modal JSX */}
            {/* Add Category Modal */}
            {showAddCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                    <Plus className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">New Category</h3>
                            </div>
                            <button 
                                onClick={() => setShowAddCategoryModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                disabled={loading.type === 'add-category'}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddCategory} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Category Name <span className="text-rose-500">*</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                                        placeholder="e.g., Appetizers, Main Dishes"
                                        required
                                        disabled={loading.type === 'add-category'}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </div>
                                    <textarea
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                                        placeholder="Brief description of this category..."
                                        rows="3"
                                        disabled={loading.type === 'add-category'}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCategoryModal(false)}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                    disabled={loading.type === 'add-category'}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading.type === 'add-category'}
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all flex items-center disabled:opacity-50"
                                >
                                    {loading.type === 'add-category' ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Create Category
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Add Item Modal */}
            {showAddItemModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center">
                                <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                                    <Plus className="h-5 w-5 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">New Menu Item</h3>
                            </div>
                            <button 
                                onClick={() => setShowAddItemModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                disabled={loading.type === 'add-item'}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddItem} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Item Name <span className="text-rose-500">*</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                        placeholder="e.g., Grilled Salmon, Caesar Salad"
                                        required
                                        disabled={loading.type === 'add-item'}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </div>
                                    <textarea
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                                        placeholder="Describe the ingredients, preparation, etc..."
                                        rows="3"
                                        disabled={loading.type === 'add-item'}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Price (₱) <span className="text-rose-500">*</span>
                                        </div>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="number"
                                                value={newItem.price}
                                                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                required
                                                disabled={loading.type === 'add-item'}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Category <span className="text-rose-500">*</span>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={newItem.category_id}
                                                onChange={(e) => setNewItem({...newItem, category_id: e.target.value})}
                                                required
                                                disabled={loading.type === 'add-item'}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none disabled:opacity-50"
                                            >
                                                <option value="">Select category</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 h-4 w-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Stock Quantity <span className="text-rose-500">*</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={newItem.stock_quantity}
                                            onChange={(e) => setNewItem({...newItem, stock_quantity: e.target.value})}
                                            placeholder="0"
                                            min="0"
                                            required
                                            disabled={loading.type === 'add-item'}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Low Stock Threshold <span className="text-rose-500">*</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={newItem.low_stock_threshold}
                                            onChange={(e) => setNewItem({...newItem, low_stock_threshold: e.target.value})}
                                            placeholder="10"
                                            min="0"
                                            required
                                            disabled={loading.type === 'add-item'}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddItemModal(false)}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                    disabled={loading.type === 'add-item'}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading.type === 'add-item'}
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-lg transition-all flex items-center disabled:opacity-50"
                                >
                                    {loading.type === 'add-item' ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Create Item
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Edit Category Modal */}
            {showEditCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                    <Edit className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Edit Category</h3>
                            </div>
                            <button 
                                onClick={() => setShowEditCategoryModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                disabled={loading.type === 'update-category'}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCategory} className="p-6">
                            <input type="hidden" value={editCategory.id} />
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Category Name <span className="text-rose-500">*</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={editCategory.name}
                                        onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                                        required
                                        disabled={loading.type === 'update-category'}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </div>
                                    <textarea
                                        value={editCategory.description}
                                        onChange={(e) => setEditCategory({...editCategory, description: e.target.value})}
                                        rows="3"
                                        disabled={loading.type === 'update-category'}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditCategoryModal(false)}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                    disabled={loading.type === 'update-category'}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading.type === 'update-category'}
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg transition-all flex items-center disabled:opacity-50"
                                >
                                    {loading.type === 'update-category' ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Edit Item Modal */}
            {showEditItemModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center">
                                <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                                    <Edit className="h-5 w-5 text-emerald-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Edit Menu Item</h3>
                            </div>
                            <button 
                                onClick={() => setShowEditItemModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                disabled={loading.type === 'update-item'}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateItem} className="p-6">
                            <input type="hidden" value={editItem.id} />
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Item Name <span className="text-rose-500">*</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={editItem.name}
                                        onChange={(e) => setEditItem({...editItem, name: e.target.value})}
                                        required
                                        disabled={loading.type === 'update-item'}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </div>
                                    <textarea
                                        value={editItem.description}
                                        onChange={(e) => setEditItem({...editItem, description: e.target.value})}
                                        rows="3"
                                        disabled={loading.type === 'update-item'}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Price (₱) <span className="text-rose-500">*</span>
                                        </div>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="number"
                                                value={editItem.price}
                                                onChange={(e) => setEditItem({...editItem, price: e.target.value})}
                                                step="0.01"
                                                min="0"
                                                required
                                                disabled={loading.type === 'update-item'}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Category <span className="text-rose-500">*</span>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={editItem.category_id}
                                                onChange={(e) => setEditItem({...editItem, category_id: e.target.value})}
                                                required
                                                disabled={loading.type === 'update-item'}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none disabled:opacity-50"
                                            >
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 h-4 w-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Stock Quantity <span className="text-rose-500">*</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={editItem.stock_quantity}
                                            onChange={(e) => setEditItem({...editItem, stock_quantity: e.target.value})}
                                            min="0"
                                            required
                                            disabled={loading.type === 'update-item'}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Low Stock Threshold <span className="text-rose-500">*</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={editItem.low_stock_threshold}
                                            onChange={(e) => setEditItem({...editItem, low_stock_threshold: e.target.value})}
                                            min="0"
                                            required
                                            disabled={loading.type === 'update-item'}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditItemModal(false)}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                    disabled={loading.type === 'update-item'}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading.type === 'update-item'}
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-lg transition-all flex items-center disabled:opacity-50"
                                >
                                    {loading.type === 'update-item' ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Add custom animations to Tailwind */}
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
                
                @keyframes scale-in {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
                
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
            `}</style>
        </AdminLayout>
    );
}