// resources/js/Pages/Admin/Inventory/Ingredients.jsx
import React, { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    Edit,
    Trash2,
    Search,
    AlertTriangle,
    CheckCircle,
    XCircle,
    TrendingDown,
    Loader2,
    X,
    Save,
    Download,
    Upload
} from 'lucide-react';

export default function Ingredients({
    ingredients: initialIngredients = [],
    onUpdate,
    pool = 'resto',
    canManage = true
}) {
    const STOCK_UNITS = ['kg', 'g', 'ml', 'l', 'box', 'pcs'];

    const normalizeUnitForForm = (unit) => {
        const value = String(unit || '').trim().toLowerCase();

        if (['l', 'liter', 'litre', 'liters', 'litres', 'ltr', 'ltrs'].includes(value)) return 'l';
        if (['ml', 'milliliter', 'millilitre', 'milliliters', 'millilitres', 'mls'].includes(value)) return 'ml';
        if (['pcs', 'pc', 'piece', 'pieces'].includes(value)) return 'pcs';
        if (value === 'pack') return 'box';
        if (value === 'kg' || value === 'g' || value === 'box') return value;

        return 'kg';
    };

    const [ingredients, setIngredients] = useState(initialIngredients);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    
    // Form states
    const [formData, setFormData] = useState({
        name: '',
        unit: 'kg',
        quantity: 0
    });


    // Bulk update state
    const [bulkUpdates, setBulkUpdates] = useState([]);

    // Filter ingredients
    const filteredIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setIngredients(initialIngredients);
    }, [initialIngredients]);

    // Low stock ingredients
    const lowStockIngredients = ingredients.filter(ing => 
        ing.quantity <= ing.min_stock && ing.quantity > 0
    );
    
    const outOfStockIngredients = ingredients.filter(ing => ing.quantity <= 0);

    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Get CSRF token
    const getCsrfToken = () => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    };

    // Handle add ingredient
    const handleAddIngredient = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/admin/inventory/ingredients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    unit: formData.unit,
                    quantity: formData.quantity,
                    pool
                })
            });

            const data = await response.json();

            if (data.success) {
                setIngredients([...ingredients, data.ingredient]);
                setShowAddModal(false);
                setFormData({ name: '', unit: 'kg', quantity: 0 });
                showNotification('Ingredient added successfully');
                onUpdate && onUpdate();
            } else {
                showNotification(data.message || 'Failed to add ingredient', 'error');
            }
        } catch (error) {
            showNotification('Error adding ingredient', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle update ingredient
    const handleUpdateIngredient = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/admin/inventory/ingredients/${selectedIngredient.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    unit: formData.unit,
                    quantity: formData.quantity,
                    pool
                })
            });

            const data = await response.json();

            if (data.success) {
                setIngredients(ingredients.map(ing => 
                    ing.id === selectedIngredient.id ? data.ingredient : ing
                ));
                setShowEditModal(false);
                showNotification('Ingredient updated successfully');
                onUpdate && onUpdate();
            } else {
                showNotification(data.message || 'Failed to update ingredient', 'error');
            }
        } catch (error) {
            showNotification('Error updating ingredient', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete ingredient
    const handleDeleteIngredient = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`/admin/inventory/ingredients/${selectedIngredient.id}?pool=${encodeURIComponent(pool)}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setIngredients(ingredients.filter(ing => ing.id !== selectedIngredient.id));
                setShowDeleteModal(false);
                showNotification('Ingredient deleted successfully');
                onUpdate && onUpdate();
            } else {
                showNotification(data.message || 'Failed to delete ingredient', 'error');
            }
        } catch (error) {
            showNotification('Error deleting ingredient', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle bulk stock update
    const handleBulkUpdate = async () => {
        setIsLoading(true);

        try {
            const response = await fetch('/admin/inventory/bulk-update-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    pool,
                    updates: bulkUpdates
                })
            });

            const data = await response.json();

            if (data.success) {
                setIngredients(data.ingredients);
                setShowBulkModal(false);
                setBulkUpdates([]);
                showNotification('Stock updated successfully');
                onUpdate && onUpdate();
            } else {
                showNotification(data.message || 'Failed to update stock', 'error');
            }
        } catch (error) {
            showNotification('Error updating stock', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Export ingredients
    const exportIngredients = () => {
        const csv = [
            ['Name', 'Total Value'],
            ...ingredients.map(ing => {
                const costPerUnit = Number(ing.cost_per_unit) || 0;
                return [
                    ing.name,
                    (ing.quantity * costPerUnit).toFixed(2)
                ];
            })
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ingredients-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

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
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="h-6 w-6 text-emerald-600" />
                        Ingredient Inventory
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your raw ingredients and stock levels ({pool.toUpperCase()} pool)
                    </p>
                    {!canManage && (
                        <p className="text-sm text-amber-700 mt-2">
                            Combined view is read-only. Switch to a specific pool to edit stock.
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportIngredients}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                    <button
                        onClick={() => setShowBulkModal(true)}
                        disabled={!canManage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        Bulk Update
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        disabled={!canManage}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Ingredient
                    </button>
                </div>
            </div>

            {/* Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Ingredients</p>
                            <p className="text-2xl font-bold text-gray-900">{ingredients.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Low Stock Items</p>
                            <p className="text-2xl font-bold text-amber-600">{lowStockIngredients.length}</p>
                        </div>
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <TrendingDown className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600">{outOfStockIngredients.length}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(searchTerm)}
                            placeholder="Search ingredients by name..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <button
                        onClick={() => {/* Search is already automatic, but we can add focus here */ document.querySelector('input[placeholder*="Search"]')?.focus()}}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                        <Search className="h-4 w-4" />
                        Search
                    </button>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </button>
                    )}
                </div>
                {searchTerm && (
                    <p className="text-sm text-gray-500 mt-2">
                        Showing {filteredIngredients.length} of {ingredients.length} ingredients
                    </p>
                )}
            </div>

            {/* Ingredients Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ingredient
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Value
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredIngredients.map((ingredient) => {
                            const costPerUnit = Number(ingredient.cost_per_unit) || 0;
                            const totalValue = ingredient.quantity * costPerUnit;
                            const isLowStock = ingredient.quantity <= ingredient.min_stock && ingredient.quantity > 0;
                            const isOutOfStock = ingredient.quantity <= 0;
                            
                            return (
                                <tr key={ingredient.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{ingredient.name}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">₱{totalValue.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        {isOutOfStock ? (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                Out of Stock
                                            </span>
                                        ) : isLowStock ? (
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                                Low Stock
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                In Stock
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {canManage && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        const unit = normalizeUnitForForm(ingredient.unit);
                                                        setSelectedIngredient(ingredient);
                                                        setFormData({
                                                            name: ingredient.name || '',
                                                            unit,
                                                            quantity: Number(ingredient.quantity) || 0
                                                        });
                                                        setShowEditModal(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedIngredient(ingredient);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredIngredients.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No ingredients found</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && canManage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">
                                {showAddModal ? 'Add New Ingredient' : 'Edit Ingredient'}
                            </h3>
                        </div>
                        <form onSubmit={showAddModal ? handleAddIngredient : handleUpdateIngredient}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Current Stock *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0"
                                            value={formData.quantity || 0}
                                            onChange={(e) => setFormData({...formData, quantity: e.target.value ? parseFloat(e.target.value) : 0})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stock Unit *
                                        </label>
                                        <select
                                            value={formData.unit}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                unit: e.target.value
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            required
                                        >
                                            {STOCK_UNITS.map((unit) => (
                                                <option key={`stock-${unit}`} value={unit}>
                                                    {unit}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setShowEditModal(false);
                                    setFormData({ name: '', unit: 'kg', quantity: 0 });

                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {showAddModal ? 'Add Ingredient' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && canManage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Ingredient</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <span className="font-semibold">{selectedIngredient?.name}</span>?
                                This will affect all recipes using this ingredient.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteIngredient}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Update Modal */}
            {showBulkModal && canManage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Bulk Stock Update</h3>
                            <p className="text-sm text-gray-500 mt-1">Update multiple ingredients at once</p>
                        </div>
                        <div className="p-6">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ingredient</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Current</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">New Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {ingredients.map(ing => (
                                        <tr key={ing.id}>
                                            <td className="px-4 py-2">
                                                <div className="font-medium">{ing.name}</div>
                                                <div className="text-xs text-gray-500">{ing.unit}</div>
                                            </td>
                                            <td className="px-4 py-2">{ing.quantity}</td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0"
                                                    value={bulkUpdates.find(u => u.id === ing.id)?.quantity ?? ing.quantity}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value);
                                                        setBulkUpdates(prev => {
                                                            const existing = prev.findIndex(u => u.id === ing.id);
                                                            if (existing >= 0) {
                                                                const newUpdates = [...prev];
                                                                newUpdates[existing] = { id: ing.id, quantity: value };
                                                                return newUpdates;
                                                            }
                                                            return [...prev, { id: ing.id, quantity: value }];
                                                        });
                                                    }}
                                                    className="w-24 px-2 py-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowBulkModal(false);
                                    setBulkUpdates([]);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkUpdate}
                                disabled={isLoading || bulkUpdates.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Update Stock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
