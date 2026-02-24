<?php
// app/Http/Controllers/Admin/FoodItemController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class FoodItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Item::with('category')
            ->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'desc');

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('ingredients', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->has('category_id') && $request->category_id !== 'all' && !empty($request->category_id)) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by featured
        if ($request->has('is_featured') && $request->is_featured !== '') {
            $query->where('is_featured', $request->is_featured === 'true' || $request->is_featured === '1');
        }

        // Filter by status
        if ($request->has('status') && !empty($request->status)) {
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

        // Handle API/JSON requests
        if ($request->wantsJson() || $request->ajax() || $request->has('limit')) {
            $limit = $request->get('limit', 1000);
            $items = $query->limit($limit)->get();
            
            return response()->json([
                'success' => true,
                'items' => $items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'description' => $item->description,
                        'price' => (float)$item->price,
                        'category_id' => $item->category_id,
                        'category_name' => $item->category->name ?? '',
                        'is_available' => (bool)$item->is_available,
                        'is_featured' => (bool)$item->is_featured,
                        'stock_quantity' => (int)$item->stock_quantity,
                        'low_stock_threshold' => (int)$item->low_stock_threshold,
                        'sort_order' => (int)$item->sort_order,
                        'image' => $item->image,
                    ];
                }),
            ]);
        }

        // For Inertia view
        $items = $query->paginate(15);
        $categories = Category::where('is_active', true)->orderBy('sort_order', 'asc')->get();

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
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:items,name',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'category_id' => 'required|exists:categories,id',
                'ingredients' => 'nullable|string',
                'preparation_time' => 'nullable|integer|min:0',
                'stock_quantity' => 'required|integer|min:0',
                'low_stock_threshold' => 'required|integer|min:0',
                'is_featured' => 'nullable|boolean',
                'is_available' => 'nullable|boolean',
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
            $validated['is_available'] = isset($validated['is_available']) ? (bool)$validated['is_available'] : true;
            $validated['is_featured'] = isset($validated['is_featured']) ? (bool)$validated['is_featured'] : false;

            $item = Item::create($validated);
            
            // Load category relationship
            $item->load('category');
            
            DB::commit();

            // Broadcast menu update to POS and Kitchen
            $this->broadcastMenuUpdate();

            // Get updated stats
            $stats = $this->getStats();

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
                    'is_featured' => (bool)$item->is_featured,
                    'stock_quantity' => (int)$item->stock_quantity,
                    'low_stock_threshold' => (int)$item->low_stock_threshold,
                    'sort_order' => (int)$item->sort_order,
                    'image' => $item->image,
                ],
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create item: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:items,name,' . $item->id,
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'category_id' => 'required|exists:categories,id',
                'ingredients' => 'nullable|string',
                'preparation_time' => 'nullable|integer|min:0',
                'stock_quantity' => 'required|integer|min:0',
                'low_stock_threshold' => 'required|integer|min:0',
                'is_featured' => 'nullable|boolean',
                'is_available' => 'nullable|boolean',
                'sort_order' => 'nullable|integer',
                'image' => 'nullable|image|max:2048',
            ]);

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($item->image) {
                    Storage::disk('public')->delete($item->image);
                }
                
                $imagePath = $request->file('image')->store('food-items', 'public');
                $validated['image'] = $imagePath;
            } elseif ($request->has('remove_image') && $request->remove_image) {
                // Remove image if requested
                if ($item->image) {
                    Storage::disk('public')->delete($item->image);
                }
                $validated['image'] = null;
            }

            $item->update($validated);
            
            // Load category relationship
            $item->load('category');
            
            DB::commit();

            // Broadcast menu update to POS and Kitchen
            $this->broadcastMenuUpdate();

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
                    'is_featured' => (bool)$item->is_featured,
                    'stock_quantity' => (int)$item->stock_quantity,
                    'low_stock_threshold' => (int)$item->low_stock_threshold,
                    'sort_order' => (int)$item->sort_order,
                    'image' => $item->image,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update item: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle item availability status.
     */
    public function toggleStatus(Request $request, Item $item)
    {
        try {
            DB::beginTransaction();

            $item->update([
                'is_available' => !$item->is_available,
            ]);
            
            DB::commit();

            // Broadcast menu update to POS and Kitchen
            $this->broadcastMenuUpdate();

            // Get updated stats
            $stats = $this->getStats();
            
            return response()->json([
                'success' => true,
                'message' => 'Item availability updated!',
                'is_available' => $item->is_available,
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to toggle item status: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update item status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle item featured status.
     */
    public function toggleFeatured(Request $request, Item $item)
    {
        try {
            DB::beginTransaction();

            $item->update([
                'is_featured' => !$item->is_featured
            ]);
            
            DB::commit();

            // Broadcast menu update to POS and Kitchen
            $this->broadcastMenuUpdate();

            return response()->json([
                'success' => true,
                'message' => 'Item featured status updated!',
                'is_featured' => $item->is_featured,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to toggle featured status: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update featured status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Item $item)
    {
        try {
            DB::beginTransaction();

            // Check if item is used in any sales
            if ($item->saleItems()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete item that has been sold. Consider marking it as unavailable instead.'
                ], 400);
            }

            // Delete image if exists
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }

            $item->delete();
            
            DB::commit();

            // Broadcast menu update to POS and Kitchen
            $this->broadcastMenuUpdate();

            // Get updated stats
            $stats = $this->getStats();

            return response()->json([
                'success' => true,
                'message' => 'Food item deleted successfully!',
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete item: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update item order.
     */
    public function updateOrder(Request $request)
    {
        try {
            DB::beginTransaction();

            $request->validate([
                'items' => 'required|array',
                'items.*.id' => 'required|exists:items,id',
                'items.*.sort_order' => 'required|integer|min:1',
            ]);

            foreach ($request->items as $itemData) {
                Item::where('id', $itemData['id'])->update(['sort_order' => $itemData['sort_order']]);
            }
            
            DB::commit();

            // Broadcast menu update to POS and Kitchen
            $this->broadcastMenuUpdate();

            return response()->json([
                'success' => true,
                'message' => 'Order updated successfully!'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update order: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update stock quantity.
     */
    public function updateStock(Request $request, Item $item)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'stock_quantity' => 'required|integer|min:0',
            ]);

            $item->update($validated);
            
            DB::commit();

            // Broadcast menu update to POS and Kitchen
            $this->broadcastMenuUpdate();

            return response()->json([
                'success' => true,
                'message' => 'Stock quantity updated successfully!',
                'item' => [
                    'id' => $item->id,
                    'stock_quantity' => $item->stock_quantity,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update stock: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update stock: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all items for POS (real-time)
     */
    public function getForPos(Request $request)
    {
        $items = Item::with('category')
            ->where('is_available', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'description' => $item->description,
                    'price' => (float)$item->price,
                    'category_id' => $item->category_id,
                    'category_name' => $item->category->name ?? '',
                    'is_available' => (bool)$item->is_available,
                    'stock_quantity' => (int)$item->stock_quantity,
                    'low_stock_threshold' => (int)$item->low_stock_threshold,
                    'image' => $item->image,
                ];
            });

        return response()->json([
            'success' => true,
            'items' => $items,
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    /**
     * Get dashboard statistics
     */
    private function getStats()
    {
        return [
            'total_categories' => Category::count(),
            'total_items' => Item::count(),
            'active_categories' => Category::where('is_active', true)->count(),
            'available_items' => Item::where('is_available', true)->count(),
        ];
    }

    /**
     * Broadcast menu update
     */
    private function broadcastMenuUpdate()
    {
        try {
            cache()->put('menu_last_updated', now()->timestamp, 60);
            Log::info('Menu update broadcasted', ['timestamp' => now()->timestamp]);
        } catch (\Exception $e) {
            Log::error('Failed to broadcast menu update: ' . $e->getMessage());
        }
    }
}