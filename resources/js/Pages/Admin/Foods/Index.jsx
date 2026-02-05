import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AdminLayout from '@/Layouts/AdminLayout';

export default function FoodsIndex({ auth, categories: initialCategories, items: initialItems, stats }) {
    const { props } = usePage();
    const [categories, setCategories] = useState(initialCategories);
    const [items, setItems] = useState(initialItems);
    const [currentTab, setCurrentTab] = useState('categories');
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category_id: '' });
    const [editCategory, setEditCategory] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(route('admin.foods.category.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(newCategory)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message);
                setCategories([...categories, data.category]);
                setNewCategory({ name: '', description: '' });
                setShowCategoryModal(false);
                
                // Update stats if provided
                if (data.stats) {
                    // You might want to update stats here
                }
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Error adding category', 'error');
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(route('admin.foods.item.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(newItem)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message);
                setItems([...items, data.item]);
                setNewItem({ name: '', description: '', price: '', category_id: '' });
                setShowItemModal(false);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Error adding item', 'error');
        }
    };

    const handleToggleCategory = async (categoryId) => {
        try {
            const response = await fetch(route('admin.foods.category.toggle', categoryId), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': props.csrf_token,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message);
                setCategories(categories.map(cat => 
                    cat.id === categoryId 
                        ? { ...cat, is_active: data.is_active }
                        : cat
                ));
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Error toggling category', 'error');
        }
    };

    const handleToggleItem = async (itemId) => {
        try {
            const response = await fetch(route('admin.foods.item.toggle', itemId), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': props.csrf_token,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message);
                setItems(items.map(item => 
                    item.id === itemId 
                        ? { ...item, is_available: data.is_available }
                        : item
                ));
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Error toggling item', 'error');
        }
    };

    const handleDeleteCategory = async (categoryId, categoryName) => {
        if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) return;
        
        try {
            const response = await fetch(route('admin.foods.category.destroy', categoryId), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': props.csrf_token,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message);
                setCategories(categories.filter(cat => cat.id !== categoryId));
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Error deleting category', 'error');
        }
    };

    const handleDeleteItem = async (itemId, itemName) => {
        if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;
        
        try {
            const response = await fetch(route('admin.foods.item.destroy', itemId), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': props.csrf_token,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message);
                setItems(items.filter(item => item.id !== itemId));
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Error deleting item', 'error');
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(route('admin.foods.category.update', editCategory.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(editCategory)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message);
                setCategories(categories.map(cat => 
                    cat.id === editCategory.id ? data.category : cat
                ));
                setEditCategory(null);
                setShowEditCategoryModal(false);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Error updating category', 'error');
        }
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(route('admin.foods.item.update', editItem.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': props.csrf_token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(editItem)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message);
                setItems(items.map(item => 
                    item.id === editItem.id ? data.item : item
                ));
                setEditItem(null);
                setShowEditItemModal(false);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Error updating item', 'error');
        }
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Food Management" />
            
            {/* Notification */}
            {notification && (
                <div className={`notification ${notification.type}`}>
                    <i className={`fas fa-${notification.type === 'success' ? 'check' : 'exclamation'}-circle`}></i>
                    {notification.message}
                </div>
            )}
            
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    <i className="fas fa-utensils mr-2"></i>
                    Food Menu Management
                </h1>
                <p className="text-gray-600 mb-8">Manage categories and menu items</p>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="bg-yellow-500 text-white rounded-full p-3 mr-4">
                                <i className="fas fa-tags"></i>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                                <div className="flex items-baseline">
                                    <span className="text-2xl font-bold">{stats.total_categories}</span>
                                    <span className="ml-2 text-sm text-green-600">
                                        ({stats.active_categories} active)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="bg-blue-500 text-white rounded-full p-3 mr-4">
                                <i className="fas fa-utensils"></i>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Menu Items</h3>
                                <div className="flex items-baseline">
                                    <span className="text-2xl font-bold">{stats.total_items}</span>
                                    <span className="ml-2 text-sm text-green-600">
                                        ({stats.available_items} available)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setCurrentTab('categories')}
                            className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                currentTab === 'categories'
                                    ? 'border-yellow-500 text-yellow-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <i className="fas fa-tags mr-2"></i>
                            Categories ({stats.total_categories})
                        </button>
                        <button
                            onClick={() => setCurrentTab('items')}
                            className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                currentTab === 'items'
                                    ? 'border-yellow-500 text-yellow-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <i className="fas fa-utensils mr-2"></i>
                            Menu Items ({stats.total_items})
                        </button>
                    </nav>
                </div>
                
                {/* Add Button */}
                <div className="mb-6">
                    <button
                        onClick={() => currentTab === 'categories' ? setShowCategoryModal(true) : setShowItemModal(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg inline-flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add {currentTab === 'categories' ? 'Category' : 'Item'}
                    </button>
                </div>
                
                {/* Categories Tab */}
                {currentTab === 'categories' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {categories.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                <i className="fas fa-tags text-3xl mb-2 block"></i>
                                                No categories yet
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((category) => (
                                            <tr key={category.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        #{category.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{category.name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {category.description || (
                                                            <span className="text-gray-400">No description</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        category.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        <i className={`fas fa-${category.is_active ? 'check' : 'times'}-circle mr-1`}></i>
                                                        {category.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditCategory(category);
                                                                setShowEditCategoryModal(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            <i className="fas fa-edit mr-1"></i> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleCategory(category.id)}
                                                            className={`${
                                                                category.is_active
                                                                    ? 'text-yellow-600 hover:text-yellow-900'
                                                                    : 'text-green-600 hover:text-green-900'
                                                            }`}
                                                        >
                                                            <i className={`fas fa-toggle-${category.is_active ? 'on' : 'off'} mr-1`}></i>
                                                            {category.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(category.id, category.name)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <i className="fas fa-trash mr-1"></i> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {/* Items Tab */}
                {currentTab === 'items' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Item Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                                <i className="fas fa-utensils text-3xl mb-2 block"></i>
                                                No menu items yet
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        #{item.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{item.name}</div>
                                                        {item.description && (
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {item.description.length > 50
                                                                    ? `${item.description.substring(0, 50)}...`
                                                                    : item.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        <i className="fas fa-folder mr-1"></i>
                                                        {item.category_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-medium text-gray-900">
                                                        ₱{parseFloat(item.price).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        item.is_available
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        <i className={`fas fa-${item.is_available ? 'check' : 'times'}-circle mr-1`}></i>
                                                        {item.is_available ? 'Available' : 'Unavailable'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditItem(item);
                                                                setShowEditItemModal(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            <i className="fas fa-edit mr-1"></i> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleItem(item.id)}
                                                            className={`${
                                                                item.is_available
                                                                    ? 'text-yellow-600 hover:text-yellow-900'
                                                                    : 'text-green-600 hover:text-green-900'
                                                            }`}
                                                        >
                                                            <i className={`fas fa-toggle-${item.is_available ? 'on' : 'off'} mr-1`}></i>
                                                            {item.is_available ? 'Unavailable' : 'Available'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id, item.name)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <i className="fas fa-trash mr-1"></i> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Add Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                <i className="fas fa-plus mr-2"></i>
                                Add New Category
                            </h3>
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleAddCategory}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="e.g., Appetizers, Main Dishes"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    rows="3"
                                    placeholder="Brief description of this category"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryModal(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Add Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Add Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                <i className="fas fa-plus mr-2"></i>
                                Add New Menu Item
                            </h3>
                            <button
                                onClick={() => setShowItemModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleAddItem}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="e.g., Grilled Salmon, Caesar Salad"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    rows="2"
                                    placeholder="Describe the item"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Price (₱) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Category *
                                </label>
                                <select
                                    value={newItem.category_id}
                                    onChange={(e) => setNewItem({...newItem, category_id: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowItemModal(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Edit Category Modal */}
            {showEditCategoryModal && editCategory && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                <i className="fas fa-edit mr-2"></i>
                                Edit Category
                            </h3>
                            <button
                                onClick={() => setShowEditCategoryModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCategory}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    value={editCategory.name}
                                    onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={editCategory.description || ''}
                                    onChange={(e) => setEditCategory({...editCategory, description: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditCategoryModal(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Update Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Edit Item Modal */}
            {showEditItemModal && editItem && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                <i className="fas fa-edit mr-2"></i>
                                Edit Menu Item
                            </h3>
                            <button
                                onClick={() => setShowEditItemModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateItem}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    value={editItem.name}
                                    onChange={(e) => setEditItem({...editItem, name: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={editItem.description || ''}
                                    onChange={(e) => setEditItem({...editItem, description: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    rows="2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Price (₱) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editItem.price}
                                    onChange={(e) => setEditItem({...editItem, price: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Category *
                                </label>
                                <select
                                    value={editItem.category_id}
                                    onChange={(e) => setEditItem({...editItem, category_id: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditItemModal(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Update Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}