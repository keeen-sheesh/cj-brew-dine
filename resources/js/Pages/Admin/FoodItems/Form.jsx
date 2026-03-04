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
    Loader2,
    Tag,
    Eye,
    EyeOff,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

function parsePortionAndNotes(rawNotes) {
    const text = String(rawNotes || '');
    const match = text.match(/^\[portion:(solo|whole|both)\]\s*/i);

    if (!match) {
        return { portion: 'both', notes: text };
    }

    return {
        portion: match[1].toLowerCase(),
        notes: text.replace(/^\[portion:(solo|whole|both)\]\s*/i, ''),
    };
}

function buildNotesWithPortion(notes, portion) {
    const normalizedPortion = ['solo', 'whole', 'both'].includes(portion) ? portion : 'both';
    const cleanedNotes = String(notes || '').trim();
    const prefix = `[portion:${normalizedPortion}]`;
    return cleanedNotes ? `${prefix} ${cleanedNotes}` : prefix;
}

function normalizeStockUnit(unit) {
    const value = String(unit || '').trim().toLowerCase();

    if (['kilogram', 'kilograms', 'kgs'].includes(value)) return 'kg';
    if (['gram', 'grams', 'gm', 'gms'].includes(value)) return 'g';
    if (['liter', 'litre', 'liters', 'litres', 'ltr', 'ltrs'].includes(value)) return 'l';
    if (['milliliter', 'millilitre', 'milliliters', 'millilitres', 'mls'].includes(value)) return 'ml';
    if (['pack', 'packs', 'box', 'boxes'].includes(value)) return 'box';
    if (['pcs', 'pc', 'piece', 'pieces'].includes(value)) return 'pcs';

    return value || 'kg';
}

export default function FoodItemForm({
    item = null,
    categories = [],
    ingredients: availableIngredients = [],
    onSave,
    onClose
}) {
    const STOCK_UNITS = ['kg', 'g', 'ml', 'l', 'box', 'pcs'];

    const [formData, setFormData] = useState({
        name: item?.name || '',
        description: item?.description || '',
        pricing_type: item?.pricing_type || 'single',
        price: item?.pricing_type === 'dual' ? (item?.price_solo || item?.price || '') : (item?.price || ''),
        price_solo: item?.price_solo || '',
        price_whole: item?.price_whole || '',
        category_id: item?.category_id || '',
        stock_quantity: item?.stock_quantity ?? 0,
        low_stock_threshold: item?.low_stock_threshold ?? 10,
        is_available: item?.is_available ?? true,
        is_featured: item?.is_featured || false,
        image: null,
        image_preview: item?.image ? getImageUrl(item.image) : null,
        ingredients: item?.ingredients?.map(ing => {
            const parsed = parsePortionAndNotes(ing?.pivot?.notes ?? ing?.notes ?? '');
            return {
                id: ing.id,
                name: ing.name,
                quantity_required: ing?.pivot?.quantity_required ?? ing?.quantity_required ?? 0,
                unit: normalizeStockUnit(ing?.pivot?.unit ?? ing?.unit ?? ''),
                notes: parsed.notes,
                portion: parsed.portion,
                cost_per_unit: ing?.cost_per_unit ?? 0,
                current_stock: ing?.current_stock ?? ing?.quantity ?? 0
            };
        }) || []
    });

    const [searchIngredient, setSearchIngredient] = useState('');
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [ingredientQuantity, setIngredientQuantity] = useState('');
    const [ingredientUnit, setIngredientUnit] = useState('');
    const [ingredientPortion, setIngredientPortion] = useState('both');
    const [ingredientNotes, setIngredientNotes] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Calculate total recipe cost
    const totalRecipeCost = formData.ingredients.reduce((sum, ing) => {
        return sum + (ing.cost_per_unit * ing.quantity_required);
    }, 0);

    // Calculate profit margin
    const basePrice = formData.pricing_type === 'dual'
        ? Number(formData.price_solo || 0)
        : Number(formData.price || 0);
    const profitMargin = basePrice > 0 && totalRecipeCost > 0
        ? ((basePrice - totalRecipeCost) / basePrice) * 100
        : 0;

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
                    unit: normalizeStockUnit(ingredientUnit || selectedIngredient.unit),
                    portion: ingredientPortion,
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
        setIngredientPortion('both');
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

    const handleUpdateIngredientPortion = (index, portion) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.map((ing, i) =>
                i === index ? { ...ing, portion } : ing
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

        if (formData.pricing_type === 'dual') {
            if (!formData.price_solo || Number(formData.price_solo) <= 0) {
                setErrors({ price_solo: 'Valid solo price is required' });
                return;
            }
            if (!formData.price_whole || Number(formData.price_whole) <= 0) {
                setErrors({ price_whole: 'Valid whole price is required' });
                return;
            }
        } else {
            if (!formData.price || Number(formData.price) <= 0) {
                setErrors({ price: 'Valid price is required' });
                return;
            }
        }

        if (!formData.category_id) {
            setErrors({ category: 'Please select a category' });
            return;
        }

        if (Number(formData.stock_quantity) < 0) {
            setErrors({ stock_quantity: 'Stock quantity cannot be negative' });
            return;
        }

        if (Number(formData.low_stock_threshold) < 0) {
            setErrors({ low_stock_threshold: 'Low stock threshold cannot be negative' });
            return;
        }

        setIsLoading(true);
        
        const submitData = new FormData();
        
        // Basic info
        submitData.append('name', formData.name.trim());
        submitData.append('description', formData.description || '');
        submitData.append('pricing_type', formData.pricing_type);
        if (formData.pricing_type === 'dual') {
            submitData.append('price', formData.price_solo);
            submitData.append('price_solo', formData.price_solo);
            submitData.append('price_whole', formData.price_whole);
        } else {
            submitData.append('price', formData.price);
        }
        submitData.append('category_id', formData.category_id);
        submitData.append('stock_quantity', String(Math.max(0, parseInt(formData.stock_quantity, 10) || 0)));
        submitData.append('low_stock_threshold', String(Math.max(0, parseInt(formData.low_stock_threshold, 10) || 0)));
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
                notes: buildNotesWithPortion(ing.notes, ing.portion)
            }))
        ));

        try {
            await onSave(submitData);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-2 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-2">
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                            {item ? (
                                <Package className="h-4 w-4 text-emerald-600" />
                            ) : (
                                <Plus className="h-4 w-4 text-emerald-600" />
                            )}
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">
                            {item ? 'Edit Menu Item' : 'Add Menu Item'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="space-y-3">
                        {/* Row 1: Basic Info */}
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-4">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className={`w-full px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="e.g., Grilled Salmon"
                                />
                                {errors.name && (
                                    <p className="mt-0.5 text-xs text-red-600">{errors.name}</p>
                                )}
                            </div>

                            <div className="col-span-2">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-medium text-gray-700">
                                        Price (₱) *
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.pricing_type === 'dual'}
                                            onChange={(e) => {
                                                const isDual = e.target.checked;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    pricing_type: isDual ? 'dual' : 'single',
                                                    price: isDual ? (prev.price_solo || prev.price) : (prev.price || prev.price_solo),
                                                    price_solo: isDual ? (prev.price_solo || prev.price) : prev.price_solo,
                                                    price_whole: isDual ? prev.price_whole : prev.price_whole
                                                }));
                                            }}
                                            className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-[11px] font-medium text-gray-700">2 Prices Available</span>
                                    </label>
                                </div>

                                {formData.pricing_type === 'dual' ? (
                                    <div className="space-y-1.5">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.price_solo}
                                                onChange={(e) => setFormData({...formData, price_solo: e.target.value})}
                                                className={`w-full pl-5 pr-2 py-1.5 text-xs border rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                                    errors.price_solo ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Solo"
                                            />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.price_whole}
                                                onChange={(e) => setFormData({...formData, price_whole: e.target.value})}
                                                className={`w-full pl-5 pr-2 py-1.5 text-xs border rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                                    errors.price_whole ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Whole"
                                            />
                                        </div>
                                        {errors.price_solo && (
                                            <p className="mt-0.5 text-xs text-red-600">{errors.price_solo}</p>
                                        )}
                                        {errors.price_whole && (
                                            <p className="mt-0.5 text-xs text-red-600">{errors.price_whole}</p>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₱</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.price}
                                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                                className={`w-full pl-5 pr-2 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                                    errors.price ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.price && (
                                            <p className="mt-0.5 text-xs text-red-600">{errors.price}</p>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Category *
                                </label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                    className={`w-full px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                        errors.category ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.category && (
                                    <p className="mt-0.5 text-xs text-red-600">{errors.category}</p>
                                )}
                            </div>

                            <div className="col-span-3 flex items-end gap-3">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_available}
                                        onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                                        className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                    />
                                    <span className="text-xs font-medium text-gray-700">Available</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_featured}
                                        onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                                        className="h-3.5 w-3.5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                    />
                                    <span className="text-xs font-medium text-gray-700">Featured</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Stock Quantity
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.stock_quantity}
                                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                                    className={`w-full px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                        errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                />
                                {errors.stock_quantity && (
                                    <p className="mt-0.5 text-xs text-red-600">{errors.stock_quantity}</p>
                                )}
                            </div>

                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Low Stock Threshold
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.low_stock_threshold}
                                    onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                                    className={`w-full px-3 py-1.5 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                        errors.low_stock_threshold ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="10"
                                />
                                {errors.low_stock_threshold && (
                                    <p className="mt-0.5 text-xs text-red-600">{errors.low_stock_threshold}</p>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Description */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                rows="2"
                                className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="Brief description of the item..."
                            />
                        </div>

                        {/* Image Upload - Compact */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-shrink-0">
                                {formData.image_preview ? (
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                                        <img 
                                            src={formData.image_preview} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, image: null, image_preview: null})}
                                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg border border-dashed border-gray-400 flex items-center justify-center">
                                        <ImageIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <input
                                    type="file"
                                    id="item-image"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            if (file.size > 2 * 1024 * 1024) {
                                                alert('Image size must be less than 2MB');
                                                return;
                                            }
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
                                    className="cursor-pointer flex items-center gap-2"
                                >
                                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                                        <Upload className="h-3.5 w-3.5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-900">Upload Image</p>
                                        <p className="text-xs text-gray-500">Max 2MB</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Recipe Section */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                    <ChefHat className="h-4 w-4 text-emerald-600" />
                                    Recipe Ingredients
                                </h3>
                                {formData.ingredients.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            Cost: ₱{totalRecipeCost.toFixed(2)}
                                        </span>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            Margin: {profitMargin.toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Add Ingredient */}
                            <div className="p-3 bg-white border-b border-gray-200">
                                <div className="grid grid-cols-12 gap-2">
                                    <div className="col-span-4">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchIngredient}
                                                onChange={(e) => {
                                                    setSearchIngredient(e.target.value);
                                                    if (errors.ingredient) {
                                                        setErrors(prev => ({ ...prev, ingredient: undefined }));
                                                    }
                                                }}
                                                placeholder="Search ingredients..."
                                                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            />
                                        </div>
                                        
                                        {searchIngredient && (
                                            <div className="absolute z-10 mt-1 w-64 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                                                {filteredIngredients.length > 0 ? (
                                                    filteredIngredients.map(ing => (
                                                        <button
                                                            key={ing.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedIngredient(ing);
                                                                setIngredientUnit(normalizeStockUnit(ing.unit));
                                                                setIngredientPortion('both');
                                                                setSearchIngredient('');
                                                                setErrors(prev => ({
                                                                    ...prev,
                                                                    ingredient: undefined,
                                                                    ingredientQuantity: undefined,
                                                                }));
                                                            }}
                                                            className="w-full px-2 py-1.5 text-left hover:bg-gray-50 flex justify-between items-center text-xs"
                                                        >
                                                            <span className="font-medium text-gray-900">{ing.name}</span>
                                                            <span className="text-gray-500">₱{ing.cost_per_unit}/{ing.unit}</span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-2 py-1.5 text-xs text-gray-500">
                                                        No matching ingredient found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.ingredient && (
                                        <div className="col-span-12 -mt-1">
                                            <p className="text-xs text-red-600">{errors.ingredient}</p>
                                        </div>
                                    )}

                                    {selectedIngredient && (
                                        <>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0.001"
                                                    value={ingredientQuantity}
                                                    onChange={(e) => {
                                                        setIngredientQuantity(e.target.value);
                                                        if (errors.ingredientQuantity) {
                                                            setErrors(prev => ({ ...prev, ingredientQuantity: undefined }));
                                                        }
                                                    }}
                                                    className={`w-full px-2 py-1.5 text-xs border rounded-lg ${
                                                        errors.ingredientQuantity ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Qty"
                                                />
                                                {errors.ingredientQuantity && (
                                                    <p className="mt-1 text-[11px] text-red-600">{errors.ingredientQuantity}</p>
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <select
                                                    value={ingredientUnit}
                                                    onChange={(e) => setIngredientUnit(e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
                                                >
                                                    {STOCK_UNITS.map((unit) => (
                                                        <option key={unit} value={unit}>
                                                            {unit}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <select
                                                    value={ingredientPortion}
                                                    onChange={(e) => setIngredientPortion(e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
                                                >
                                                    <option value="both">Both</option>
                                                    <option value="solo">Solo</option>
                                                    <option value="whole">Whole</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1">
                                                <input
                                                    type="text"
                                                    value={ingredientNotes}
                                                    onChange={(e) => setIngredientNotes(e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
                                                    placeholder="Notes"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <button
                                                    type="button"
                                                    onClick={handleAddIngredient}
                                                    disabled={!ingredientQuantity || Number(ingredientQuantity) <= 0}
                                                    className="w-full px-2 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Ingredients List */}
                            {formData.ingredients.length > 0 ? (
                                <div className="max-h-48 overflow-y-auto p-2 space-y-1.5">
                                    {formData.ingredients.map((ing, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 truncate">{ing.name}</span>
                                                    {ing.current_stock < ing.quantity_required * 10 && (
                                                        <span className="px-1 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px]">
                                                            Low
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-500 mt-0.5">
                                                    <span>₱{ing.cost_per_unit}/{ing.unit}</span>
                                                    <span>Stock: {ing.current_stock}</span>
                                                    <span className="px-1 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] uppercase">
                                                        {ing.portion || 'both'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        min="0.001"
                                                        value={ing.quantity_required}
                                                        onChange={(e) => handleUpdateIngredientQuantity(index, e.target.value)}
                                                        className="w-16 px-1.5 py-1 text-right text-xs border border-gray-300 rounded"
                                                    />
                                                    <span className="text-gray-600">{ing.unit}</span>
                                                </div>
                                                <select
                                                    value={ing.portion || 'both'}
                                                    onChange={(e) => handleUpdateIngredientPortion(index, e.target.value)}
                                                    className="px-1.5 py-1 text-xs border border-gray-300 rounded"
                                                >
                                                    <option value="both">Both</option>
                                                    <option value="solo">Solo</option>
                                                    <option value="whole">Whole</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveIngredient(index)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center">
                                    <p className="text-xs text-gray-500">No ingredients added yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 text-xs text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs rounded-lg hover:from-emerald-700 hover:to-emerald-800 font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-3 w-3" />
                                    {item ? 'Update' : 'Create'}
                                </>
                            )}
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
