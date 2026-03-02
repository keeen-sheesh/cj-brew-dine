// resources/js/Pages/Admin/FoodItems/Form.jsx

import React, { useState, useEffect } from 'react';
import {
    Save,
    X,
    Upload,
    Image as ImageIcon,
    Package,
    Plus,
    Trash2,
    Search,
    ChefHat,
    DollarSign,
    Scale,
    AlertTriangle,
    Loader2
} from 'lucide-react';

export default function FoodItemForm({
    item = null,
    categories = [],
    ingredients: availableIngredients = [],
    onSave,
    onClose
}) {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        description: item?.description || '',
        price: item?.price || '',
        category_id: item?.category_id || '',
        stock_quantity: item?.stock_quantity || 0,
        low_stock_threshold: item?.low_stock_threshold || 10,
        is_available: item?.is_available ?? true,
        is_featured: item?.is_featured || false,
        image: null,
        image_preview: item?.image ? getImageUrl(item.image) : null,
        ingredients: item?.ingredients?.map(ing => ({
            id: ing.id,
            name: ing.name,
            quantity_required: ing.pivot.quantity_required,
            unit: ing.pivot.unit || ing.unit,
            notes: ing.pivot.notes || '',
            cost_per_unit: ing.cost_per_unit,
            current_stock: ing.quantity
        })) || []
    });

    const [searchIngredient, setSearchIngredient] = useState('');
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [ingredientQuantity, setIngredientQuantity] = useState('');
    const [ingredientUnit, setIngredientUnit] = useState('');
    const [ingredientNotes, setIngredientNotes] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Calculate total recipe cost
    const totalRecipeCost = formData.ingredients.reduce((sum, ing) => {
        return sum + (ing.cost_per_unit * ing.quantity_required);
    }, 0);

    // Filter available ingredients
    const filteredIngredients = availableIngredients.filter(ing => 
        !formData.ingredients.some(i => i.id === ing.id) &&
        (ing.name.toLowerCase().includes(searchIngredient.toLowerCase()) ||
         ing.unit.toLowerCase().includes(searchIngredient.toLowerCase()))
    );

    const handleAddIngredient = () => {
        if (!selectedIngredient) {
            setErrors({ ingredient: 'Please select an ingredient' });
            return;
        }

        if (!ingredientQuantity || ingredientQuantity <= 0) {
            setErrors({ ingredientQuantity: 'Valid quantity is required' });
            return;
        }

        setFormData(prev => ({
            ...prev,
            ingredients: [
                ...prev.ingredients,
                {
                    id: selectedIngredient.id,
                    name: selectedIngredient.name,
                    quantity_required: parseFloat(ingredientQuantity),
                    unit: ingredientUnit || selectedIngredient.unit,
                    notes: ingredientNotes,
                    cost_per_unit: selectedIngredient.cost_per_unit,
                    current_stock: selectedIngredient.quantity
                }
            ]
        }));

        // Reset form
        setSelectedIngredient(null);
        setIngredientQuantity('');
        setIngredientUnit('');
        setIngredientNotes('');
        setSearchIngredient('');
        setErrors({});
    };

    const handleRemoveIngredient = (index) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    const handleUpdateIngredientQuantity = (index, quantity) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.map((ing, i) => 
                i === index ? { ...ing, quantity_required: parseFloat(quantity) || 0 } : ing
            )
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name.trim()) {
            setErrors({ name: 'Item name is required' });
            return;
        }

        if (!formData.price || formData.price <= 0) {
            setErrors({ price: 'Valid price is required' });
            return;
        }

        if (!formData.category_id) {
            setErrors({ category: 'Please select a category' });
            return;
        }

        setIsLoading(true);
        
        const submitData = new FormData();
        
        // Basic info
        submitData.append('name', formData.name.trim());
        submitData.append('description', formData.description || '');
        submitData.append('price', formData.price);
        submitData.append('category_id', formData.category_id);
        submitData.append('stock_quantity', formData.stock_quantity);
        submitData.append('low_stock_threshold', formData.low_stock_threshold);
        submitData.append('is_available', formData.is_available ? '1' : '0');
        submitData.append('is_featured', formData.is_featured ? '1' : '0');
        
        // Image
        if (formData.image) {
            submitData.append('image', formData.image);
        }
        
        // Ingredients - convert to JSON string
        submitData.append('ingredients', JSON.stringify(
            formData.ingredients.map(ing => ({
                id: ing.id,
                quantity_required: ing.quantity_required,
                unit: ing.unit,
                notes: ing.notes
            }))
        ));

        await onSave(submitData);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            {item ? <Package className="h-6 w-6 text-emerald-600" /> : <Plus className="h-6 w-6 text-emerald-600" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {item ? 'Edit Menu Item' : 'Add New Menu Item'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {item ? 'Update item details and recipe' : 'Create a new menu item with recipe'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Item Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                                            errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="e.g., Grilled Salmon"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Describe the item..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price (₱) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                                            errors.price ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                    />
                                    {errors.price && (
                                        <p className="mt-1 text-xs text-red-600">{errors.price}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category *
                                    </label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                                            errors.category ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {errors.category && (
                                        <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Stock Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Low Stock Alert
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.low_stock_threshold}
                                        onChange={(e) => setFormData({...formData, low_stock_threshold: parseInt(e.target.value) || 10})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_available}
                                        onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Available for sale</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_featured}
                                        onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Featured item</span>
                                </label>
                            </div>
                        </div>

                        {/* Recipe / Ingredients Section */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <ChefHat className="h-5 w-5 text-emerald-600" />
                                    Recipe Ingredients
                                </h3>
                                
                                {formData.ingredients.length > 0 && (
                                    <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                                        Recipe Cost: ₱{totalRecipeCost.toFixed(2)}
                                    </div>
                                )}
                            </div>

                            {/* Add Ingredient Form */}
                            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                                <h4 className="font-medium text-gray-700 mb-3">Add Ingredient to Recipe</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Search Ingredient
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchIngredient}
                                                onChange={(e) => setSearchIngredient(e.target.value)}
                                                placeholder="Type to search ingredients..."
                                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        
                                        {searchIngredient && filteredIngredients.length > 0 && (
                                            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                                {filteredIngredients.map(ing => (
                                                    <button
                                                        key={ing.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedIngredient(ing);
                                                            setIngredientUnit(ing.unit);
                                                            setSearchIngredient('');
                                                        }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
                                                    >
                                                        <span className="font-medium">{ing.name}</span>
                                                        <span className="text-xs text-gray-500">
                                                            Stock: {ing.quantity} {ing.unit}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedIngredient && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Quantity Required *
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0.001"
                                                    value={ingredientQuantity}
                                                    onChange={(e) => setIngredientQuantity(e.target.value)}
                                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                                                        errors.ingredientQuantity ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unit
                                                </label>
                                                <input
                                                    type="text"
                                                    value={ingredientUnit}
                                                    onChange={(e) => setIngredientUnit(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                    placeholder={selectedIngredient.unit}
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Notes (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={ingredientNotes}
                                                    onChange={(e) => setIngredientNotes(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                    placeholder="e.g., Use whole eggs, slice thinly..."
                                                />
                                            </div>

                                            <div className="col-span-2 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedIngredient(null);
                                                        setIngredientQuantity('');
                                                        setIngredientUnit('');
                                                        setIngredientNotes('');
                                                    }}
                                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleAddIngredient}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add to Recipe
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Ingredients List */}
                            {formData.ingredients.length > 0 ? (
                                <div className="space-y-3">
                                    {formData.ingredients.map((ing, index) => {
                                        const isLowStock = ing.current_stock < ing.quantity_required * 10;
                                        
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-gray-900">{ing.name}</h4>
                                                        {isLowStock && (
                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                                                                Low Stock
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-sm">
                                                        <span className="text-gray-600">
                                                            Current: {ing.current_stock} {ing.unit}
                                                        </span>
                                                        <span className="text-gray-600">
                                                            Cost: ₱{ing.cost_per_unit}/{ing.unit}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                step="0.001"
                                                                min="0.001"
                                                                value={ing.quantity_required}
                                                                onChange={(e) => handleUpdateIngredientQuantity(index, e.target.value)}
                                                                className="w-20 px-2 py-1 text-right border border-gray-300 rounded"
                                                            />
                                                            <span className="text-gray-600 w-12">{ing.unit}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Cost: ₱{(ing.cost_per_unit * ing.quantity_required).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveIngredient(index)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                    <p className="text-gray-500">No ingredients added yet</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Add ingredients to create a recipe for this item
                                    </p>
                                </div>
                            )}

                            {/* Recipe Summary */}
                            {formData.ingredients.length > 0 && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-5 w-5 text-blue-600" />
                                            <span className="font-medium text-blue-900">Recipe Cost:</span>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-600">
                                            ₱{totalRecipeCost.toFixed(2)}
                                        </span>
                                    </div>
                                    {formData.price > 0 && totalRecipeCost > 0 && (
                                        <div className="flex items-center justify-between mt-2 text-sm">
                                            <span className="text-gray-600">Profit Margin:</span>
                                            <span className={`font-semibold ${
                                                ((formData.price - totalRecipeCost) / formData.price) * 100 > 30 
                                                    ? 'text-green-600' 
                                                    : 'text-amber-600'
                                            }`}>
                                                {(((formData.price - totalRecipeCost) / formData.price) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-4">Item Image</h3>
                            
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    {formData.image_preview ? (
                                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                                            <img 
                                                src={formData.image_preview} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({...formData, image: null, image_preview: null})}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <input
                                        type="file"
                                        id="item-image"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setFormData({
                                                    ...formData,
                                                    image: file,
                                                    image_preview: URL.createObjectURL(file)
                                                });
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="item-image"
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer inline-flex items-center gap-2"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Upload Image
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Max file size: 2MB. Supported: JPG, PNG, GIF
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
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
                            {item ? 'Update Item' : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Helper function for image URLs
const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    const cleanPath = imagePath.replace(/^storage\//, '');
    return `/storage/${cleanPath}`;
};