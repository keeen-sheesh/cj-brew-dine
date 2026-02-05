<?php
// app/Http\Controllers/Admin/FoodItemController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FoodItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Item::with('category')
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc');

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('ingredients', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->has('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }

        // Filter by featured
        if ($request->has('is_featured')) {
            $query->where('is_featured', $request->is_featured === 'true');
        }

        // Filter by status
        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->where('is_available', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_available', false);
            }
        }

        // Filter low stock
        if ($request->has('low_stock') && $request->low_stock === 'true') {
            $query->whereRaw('stock_quantity <= low_stock_threshold');
        }

        $items = $query->paginate(15);
        $categories = Category::where('is_active', true)->orderBy('sort_order')->get();

        return Inertia::render('Admin/FoodItems/Index', [
            'items' => $items,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id', 'is_featured', 'status', 'low_stock']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:items,name',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'ingredients' => 'nullable|string',
            'preparation_time' => 'nullable|integer|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'is_featured' => 'boolean',
            'is_available' => 'boolean',
            'sort_order' => 'nullable|integer',
            'image' => 'nullable|image|max:2048',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('food-items', 'public');
            $validated['image'] = $imagePath;
        }

        // Set default sort order if not provided
        if (!isset($validated['sort_order'])) {
            $maxOrder = Item::max('sort_order') ?? 0;
            $validated['sort_order'] = $maxOrder + 1;
        }

        // Set defaults
        if (!isset($validated['is_available'])) {
            $validated['is_available'] = true;
        }
        if (!isset($validated['is_featured'])) {
            $validated['is_featured'] = false;
        }

        $item = Item::create($validated);
        
        // Get updated stats
        $stats = $this->getStats();

        // Always return JSON for Inertia/AJAX requests
        return response()->json([
            'success' => true,
            'message' => 'Food item created successfully!',
            'item' => [
                'id' => $item->id,
                'name' => $item->name,
                'description' => $item->description,
                'price' => (float)$item->price,
                'category_id' => $item->category_id,
                'category_name' => $item->category->name ?? '',
                'is_available' => (bool)$item->is_available,
                'stock_quantity' => $item->stock_quantity,
                'low_stock_threshold' => $item->low_stock_threshold,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:items,name,' . $item->id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'ingredients' => 'nullable|string',
            'preparation_time' => 'nullable|integer|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'is_featured' => 'boolean',
            'is_available' => 'boolean',
            'sort_order' => 'nullable|integer',
            'image' => 'nullable|image|max:2048',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($item->image) {
                \Storage::disk('public')->delete($item->image);
            }
            
            $imagePath = $request->file('image')->store('food-items', 'public');
            $validated['image'] = $imagePath;
        } elseif ($request->has('remove_image') && $request->remove_image) {
            // Remove image if requested
            if ($item->image) {
                \Storage::disk('public')->delete($item->image);
            }
            $validated['image'] = null;
        }

        $item->update($validated);

        // Always return JSON for Inertia/AJAX requests
        return response()->json([
            'success' => true,
            'message' => 'Food item updated successfully!',
            'item' => [
                'id' => $item->id,
                'name' => $item->name,
                'description' => $item->description,
                'price' => (float)$item->price,
                'category_id' => $item->category_id,
                'category_name' => $item->category->name ?? '',
                'is_available' => (bool)$item->is_available,
                'stock_quantity' => $item->stock_quantity,
                'low_stock_threshold' => $item->low_stock_threshold,
            ],
        ]);
    }

    /**
     * Toggle item availability.
     */
    public function toggleAvailability(Item $item)
    {
        $item->update([
            'is_available' => !$item->is_available
        ]);

        return redirect()->back()
            ->with('success', 'Item availability updated!');
    }

    /**
     * Toggle item featured status.
     */
    public function toggleFeatured(Item $item)
    {
        $item->update([
            'is_featured' => !$item->is_featured
        ]);

        return redirect()->back()
            ->with('success', 'Item featured status updated!');
    }

    // NEW METHOD: Added to match route from web.php
    /**
     * Toggle item status (same as toggleAvailability but returns JSON)
     */
    public function toggleStatus(Request $request, Item $item)
    {
        $item->update([
            'is_available' => !$item->is_available,
        ]);
        
        // Get updated stats
        $stats = $this->getStats();
        
        return response()->json([
            'success' => true,
            'message' => 'Item availability updated!',
            'is_available' => $item->is_available,
            'stats' => $stats,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Item $item)
    {
        // Delete image if exists
        if ($item->image) {
            \Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        // Get updated stats
        $stats = $this->getStats();

        return response()->json([
            'success' => true,
            'message' => 'Food item deleted successfully!',
            'stats' => $stats,
        ]);
    }

    /**
     * Update item order.
     */
    public function updateOrder(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
        ]);

        foreach ($request->items as $itemData) {
            Item::where('id', $itemData['id'])->update(['sort_order' => $itemData['sort_order']]);
        }

        return response()->json(['message' => 'Order updated successfully!']);
    }

    /**
     * Update stock quantity.
     */
    public function updateStock(Request $request, Item $item)
    {
        $validated = $request->validate([
            'stock_quantity' => 'required|integer|min:0',
        ]);

        $item->update($validated);

        // Always return JSON for Inertia/AJAX requests
        return response()->json([
            'success' => true,
            'message' => 'Stock quantity updated successfully!',
            'item' => [
                'id' => $item->id,
                'stock_quantity' => $item->stock_quantity,
            ],
        ]);
    }

    // NEW METHOD: Helper method to get stats
    /**
     * Get dashboard statistics
     */
    private function getStats()
    {
        return [
            'total_categories' => \App\Models\Category::count(),
            'total_items' => \App\Models\Item::count(),
            'active_categories' => \App\Models\Category::where('is_active', true)->count(),
            'available_items' => \App\Models\Item::where('is_available', true)->count(),
        ];
    }
}