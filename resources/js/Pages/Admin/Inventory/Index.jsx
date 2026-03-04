// resources/js/Pages/Admin/Inventory/Index.jsx

import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Package, 
    ChefHat, 
    ShoppingCart, 
    AlertTriangle, 
    Settings,
    X,
    Loader2,
    Save,
    Plus,
    Search,
    Edit,
    Trash2,
    CheckCircle,
    RefreshCw,
    FileText,
    ClipboardList,
    History
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import Ingredients from './Ingredients';
import RecipeManager from '../../../Components/RecipeManager';
import LowStockWidget from './Widgets/LowStockWidget';

export default function InventoryIndex({
    auth,
    ingredients: initialIngredients,
    items,
    stats,
    activePool = 'resto',
    availablePools = ['resto']
}) {
    const [activeTab, setActiveTab] = useState('ingredients');
    const [ingredients, setIngredients] = useState(initialIngredients || []);
    const [itemsList, setItemsList] = useState(items || []);
    const [itemSearchTerm, setItemSearchTerm] = useState('');
    const [localStats, setLocalStats] = useState(stats || {
        total_ingredients: 0,
        total_items_with_recipe: 0,
        items_needing_recipe: 0,
        low_stock_ingredients: 0
    });
    const [showRecipeManager, setShowRecipeManager] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [availableIngredients, setAvailableIngredients] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [selectedPool, setSelectedPool] = useState(activePool);
    const canSelectPool = availablePools.length > 1;
    const isCombinedPool = selectedPool === 'combined';

    // Fetch ingredients from API
    const fetchIngredients = async () => {
        try {
            const response = await fetch(`/admin/inventory/ingredients?pool=${encodeURIComponent(selectedPool)}`);
            const data = await response.json();
            if (data.success) {
                setIngredients(data.ingredients);
                setAvailableIngredients(data.ingredients);
                updateStats(data.ingredients);
            }
        } catch (error) {
            console.error('Failed to fetch ingredients:', error);
        }
    };

    // Fetch items with recipes
    const fetchItemsWithRecipes = async () => {
        try {
            const response = await fetch(`/admin/inventory/items-with-recipes?pool=${encodeURIComponent(selectedPool)}`);
            const data = await response.json();
            if (data.success) {
                setItemsList(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
    };

    // Update stats based on ingredients
    const updateStats = (ingredientsList) => {
        const lowStock = ingredientsList.filter(ing => ing.quantity <= ing.min_stock).length;
        setLocalStats(prev => ({
            ...prev,
            total_ingredients: ingredientsList.length,
            low_stock_ingredients: lowStock
        }));
    };

    // Initial data load
    useEffect(() => {
        setSelectedPool(activePool);
    }, [activePool]);

    useEffect(() => {
        fetchIngredients();
        fetchItemsWithRecipes();
    }, [selectedPool]);

    // Update available ingredients when ingredients change
    useEffect(() => {
        setAvailableIngredients(ingredients);
    }, [ingredients]);

    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Get CSRF token
    const getCsrfToken = () => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    };

    // Handle save recipe
    const handleSaveRecipe = async (recipeData) => {
        if (!selectedItem) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/admin/inventory/items/${selectedItem.id}/recipe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    ...recipeData,
                    pool: selectedPool
                })
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Recipe saved successfully!');
                setShowRecipeManager(false);
                setSelectedItem(null);
                fetchItemsWithRecipes();
            } else {
                showNotification(data.message || 'Failed to save recipe', 'error');
            }
        } catch (error) {
            showNotification('Error saving recipe', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Open recipe manager for an item
    const openRecipeManager = (item) => {
        setSelectedItem(item);
        setShowRecipeManager(true);
    };

    // Stats cards data
    const statsCards = [
        {
            label: 'Total Ingredients',
            value: localStats.total_ingredients,
            icon: Package,
            color: 'blue',
            bg: 'bg-blue-100',
            text: 'text-blue-600'
        },
        {
            label: 'Items with Recipes',
            value: localStats.total_items_with_recipe,
            icon: ChefHat,
            color: 'emerald',
            bg: 'bg-emerald-100',
            text: 'text-emerald-600'
        },
        {
            label: 'Items Needing Recipe',
            value: localStats.items_needing_recipe,
            icon: ClipboardList,
            color: 'amber',
            bg: 'bg-amber-100',
            text: 'text-amber-600'
        },
        {
            label: 'Low Stock Items',
            value: localStats.low_stock_ingredients,
            icon: AlertTriangle,
            color: 'red',
            bg: 'bg-red-100',
            text: 'text-red-600'
        }
    ];

    const tabs = [
        { id: 'ingredients', label: 'Ingredients', icon: Package },
        { id: 'items', label: 'Items & Recipes', icon: ChefHat },
        { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart }
    ];

    // Filter items based on search term
    const filteredItems = itemsList.filter(item =>
        item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
        (item.category?.name && item.category.name.toLowerCase().includes(itemSearchTerm.toLowerCase()))
    );

    return (
        <AdminLayout auth={auth}>
        <Head title="Inventory Management" />
        <div className="space-y-6">
            {/* Notifications */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border ${
                    notification.type === 'success'
                        ? 'bg-white border-emerald-200 text-emerald-800'
                        : 'bg-white border-red-200 text-red-800'
                } `}>
                    {notification.type === 'success'
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    }
                    <span className="text-sm font-medium">{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-2 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track ingredients, recipes, and stock levels</p>
                </div>
                <div className="flex items-center gap-2">
                    {canSelectPool && (
                        <select
                            value={selectedPool}
                            onChange={(e) => setSelectedPool(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {availablePools.map((pool) => (
                                <option key={pool} value={pool}>
                                    {pool.charAt(0).toUpperCase() + pool.slice(1)}
                                </option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => {
                            fetchIngredients();
                            fetchItemsWithRecipes();
                        }}
                        className="px-3 py-2 border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg ${stat.bg} shrink-0`}>
                            <stat.icon className={`h-5 w-5 ${stat.text}`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/60'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'ingredients' && (
                        <Ingredients 
                            ingredients={ingredients} 
                            onUpdate={() => fetchIngredients()}
                            pool={selectedPool}
                            canManage={!isCombinedPool}
                        />
                    )}

                    {activeTab === 'items' && (
                        <div className="space-y-5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Items & Recipes</h2>
                                    <p className="text-sm text-gray-400 mt-0.5">
                                        {localStats.total_items_with_recipe} of {itemsList.length} items have recipes
                                    </p>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={itemSearchTerm}
                                    onChange={(e) => setItemSearchTerm(e.target.value)}
                                    placeholder="Search items by name or category…"
                                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                                {itemSearchTerm && (
                                    <button
                                        onClick={() => setItemSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {itemSearchTerm && (
                                <p className="text-xs text-gray-400 -mt-3">
                                    {filteredItems.length} of {itemsList.length} items
                                </p>
                            )}

                            {/* Items Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0 mr-2">
                                                <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">{item.category?.name || 'Uncategorized'}</p>
                                            </div>
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-medium shrink-0">
                                                ₱{Number(item.price).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="mb-3 min-h-[36px]">
                                            {item.ingredients && item.ingredients.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.ingredients.slice(0, 3).map((ing, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded text-xs"
                                                        >
                                                            {ing.name}
                                                        </span>
                                                    ))}
                                                    {item.ingredients.length > 3 && (
                                                        <span className="px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded text-xs">
                                                            +{item.ingredients.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-amber-500">
                                                    <AlertTriangle className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-medium">No recipe set</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => openRecipeManager(item)}
                                            className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <ChefHat className="h-3.5 w-3.5" />
                                            {item.ingredients && item.ingredients.length > 0 ? 'Edit Recipe' : 'Add Recipe'}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {filteredItems.length === 0 && (
                                <div className="text-center py-14">
                                    <ChefHat className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                                    <p className="text-sm text-gray-400">
                                        {itemSearchTerm ? 'No items match your search' : 'No items found'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'purchase-orders' && (
                        <div className="text-center py-14">
                            <ShoppingCart className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                            <h3 className="text-base font-semibold text-gray-900 mb-1">Purchase Orders</h3>
                            <p className="text-sm text-gray-400 mb-5">Manage your purchase orders and deliveries</p>
                            <a
                                href={`/admin/inventory/purchase-orders?pool=${encodeURIComponent(selectedPool)}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
                            >
                                View Purchase Orders
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Recipe Manager Modal */}
            {showRecipeManager && selectedItem && (
                <RecipeManager
                    item={selectedItem}
                    ingredients={availableIngredients}
                    onSave={handleSaveRecipe}
                    onClose={() => {
                        setShowRecipeManager(false);
                        setSelectedItem(null);
                    }}
                />
            )}
        </div>
        </AdminLayout>
    );
}   