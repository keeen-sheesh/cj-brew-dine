// resources/js/Pages/Admin/Inventory/Index.jsx

import React, { useState, useEffect } from 'react';
import { 
    Package, 
    ChefHat, 
    ShoppingCart, 
    AlertTriangle, 
    BarChart3,
    Truck,
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
    DollarSign,
    TrendingDown,
    TrendingUp,
    ClipboardList,
    History
} from 'lucide-react';
import Ingredients from './Ingredients';
import RecipeManager from '../../../Components/RecipeManager';
import LowStockWidget from './Widgets/LowStockWidget';

export default function InventoryIndex({ ingredients: initialIngredients, items, stats }) {
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

    // Fetch ingredients from API
    const fetchIngredients = async () => {
        try {
            const response = await fetch('/admin/inventory/ingredients');
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
            const response = await fetch('/admin/inventory/items-with-recipes');
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
        fetchIngredients();
        fetchItemsWithRecipes();
    }, []);

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
                body: JSON.stringify(recipeData)
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
            icon: TrendingDown,
            color: 'red',
            bg: 'bg-red-100',
            text: 'text-red-600'
        }
    ];

    const tabs = [
        { id: 'ingredients', label: 'Ingredients', icon: Package },
        { id: 'items', label: 'Items & Recipes', icon: ChefHat },
        { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
        { id: 'suppliers', label: 'Suppliers', icon: Truck },
        { id: 'reports', label: 'Reports', icon: BarChart3 }
    ];

    // Filter items based on search term
    const filteredItems = itemsList.filter(item =>
        item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
        (item.category?.name && item.category.name.toLowerCase().includes(itemSearchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Notifications */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ${
                    notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                } text-white`}>
                    {notification.type === 'success' ? 
                        <CheckCircle className="w-5 h-5" /> : 
                        <AlertTriangle className="w-5 h-5" />
                    }
                    <span>{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-4">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Package className="h-8 w-8 text-emerald-600" />
                        Inventory Management
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage ingredients, recipes, and stock levels
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            fetchIngredients();
                            fetchItemsWithRecipes();
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.text}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
                        />
                    )}

                    {activeTab === 'items' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900">Items & Recipes</h2>
                                <p className="text-sm text-gray-500">
                                    {localStats.total_items_with_recipe} of {itemsList.length} items have recipes
                                </p>
                            </div>

                            {/* Search */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={itemSearchTerm}
                                            onChange={(e) => setItemSearchTerm(e.target.value)}
                                            placeholder="Search items by name or category..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    {itemSearchTerm && (
                                        <button
                                            onClick={() => setItemSearchTerm('')}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                                        >
                                            <X className="h-4 w-4" />
                                            Clear
                                        </button>
                                    )}
                                </div>
                                {itemSearchTerm && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        Showing {filteredItems.length} of {itemsList.length} items
                                    </p>
                                )}
                            </div>

                            {/* Items Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredItems.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                                <p className="text-sm text-gray-500">{item.category?.name || 'Uncategorized'}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                                ₱{Number(item.price).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="mb-3">
                                            {item.ingredients && item.ingredients.length > 0 ? (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-2">
                                                        {item.ingredients.length} ingredient(s) in recipe
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.ingredients.slice(0, 3).map((ing, idx) => (
                                                            <span 
                                                                key={idx}
                                                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                                            >
                                                                {ing.name}
                                                            </span>
                                                        ))}
                                                        {item.ingredients.length > 3 && (
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                                +{item.ingredients.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-600">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <span className="text-sm">No recipe set</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => openRecipeManager(item)}
                                            className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <ChefHat className="h-4 w-4" />
                                            {item.ingredients && item.ingredients.length > 0 ? 'Edit Recipe' : 'Add Recipe'}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {filteredItems.length === 0 && (
                                <div className="text-center py-12">
                                    <ChefHat className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500">
                                        {itemSearchTerm ? 'No items match your search' : 'No items found'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'purchase-orders' && (
                        <div className="text-center py-12">
                            <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Purchase Orders</h3>
                            <p className="text-gray-500 mb-4">Manage your purchase orders and supplier deliveries</p>
                            <a
                                href="/admin/inventory/purchase-orders"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                View Purchase Orders
                            </a>
                        </div>
                    )}

                    {activeTab === 'suppliers' && (
                        <div className="text-center py-12">
                            <Truck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Suppliers</h3>
                            <p className="text-gray-500 mb-4">Manage your suppliers and contacts</p>
                            <a
                                href="/admin/inventory/suppliers"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                View Suppliers
                            </a>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">Inventory Reports</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <a
                                    href="/admin/inventory/reports/usage"
                                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 transition-colors"
                                >
                                    <BarChart3 className="h-8 w-8 text-blue-600 mb-3" />
                                    <h3 className="font-medium text-gray-900">Usage Report</h3>
                                    <p className="text-sm text-gray-500 mt-1">Track ingredient usage over time</p>
                                </a>
                                <a
                                    href="/admin/inventory/reports/waste"
                                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 transition-colors"
                                >
                                    <TrendingDown className="h-8 w-8 text-red-600 mb-3" />
                                    <h3 className="font-medium text-gray-900">Waste Report</h3>
                                    <p className="text-sm text-gray-500 mt-1">Monitor wasted ingredients</p>
                                </a>
                                <a
                                    href="/admin/inventory/reports/valuation"
                                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 transition-colors"
                                >
                                    <DollarSign className="h-8 w-8 text-emerald-600 mb-3" />
                                    <h3 className="font-medium text-gray-900">Stock Valuation</h3>
                                    <p className="text-sm text-gray-500 mt-1">Current inventory value</p>
                                </a>
                                <a
                                    href="/admin/inventory/reports/forecasting"
                                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 transition-colors"
                                >
                                    <TrendingUp className="h-8 w-8 text-amber-600 mb-3" />
                                    <h3 className="font-medium text-gray-900">Forecasting</h3>
                                    <p className="text-sm text-gray-500 mt-1">Predict future stock needs</p>
                                </a>
                            </div>
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
    );
}
