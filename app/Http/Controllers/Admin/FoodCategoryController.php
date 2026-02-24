<?php
// app/Http/Controllers/Admin/FoodCategoryController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class FoodCategoryController extends Controller
{
    /**
     * Display a listing of the resource (Inertia view)
     */
    public function index()
    {
        $categories = Category::orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'is_active' => (bool)$category->is_active,
                    'is_kitchen_category' => (bool)$category->is_kitchen_category,
                    'sort_order' => $category->sort_order,
                ];
            });
            
        $items = Item::with('category')
            ->orderBy('category_id')
            ->orderBy('sort_order', 'asc')
            ->orderBy('name')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'description' => $item->description,
                    'price' => (float)$item->price,
                    'category_id' => $item->category_id,
                    'category_name' => $item->category->name ?? '',
                    'is_available' => (bool)$item->is_available,
                    'is_featured' => (bool)$item->is_featured,
                    'stock_quantity' => $item->stock_quantity ?? 0,
                    'low_stock_threshold' => $item->low_stock_threshold ?? 10,
                    'sort_order' => $item->sort_order ?? 999,
                    'image' => $item->image,
                ];
            });
        
        // Get stats
        $stats = $this->getStats();
        
        return Inertia::render('Admin/Foods', [
            'categories' => $categories,
            'items' => $items,
            'total_categories' => $stats['total_categories'],
            'total_items' => $stats['total_items'],
            'active_categories' => $stats['active_categories'],
            'available_items' => $stats['available_items'],
        ]);
    }

    /**
     * API endpoint for real-time updates
     */
    public function apiIndex(Request $request)
    {
        $categories = Category::orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'is_active' => (bool)$category->is_active,
                    'is_kitchen_category' => (bool)$category->is_kitchen_category,
                    'sort_order' => $category->sort_order,
                ];
            });
            
        return response()->json([
            'success' => true,
            'categories' => $categories
        ]);
    }

    /**
     * Store a newly created category
     */
    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:categories,name',
                'description' => 'nullable|string|max:500',
                'is_kitchen_category' => 'nullable|boolean',
            ]);
            
            // Get the max sort_order and add 1
            $maxOrder = Category::max('sort_order') ?? 0;
            
            $category = Category::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'is_kitchen_category' => isset($validated['is_kitchen_category']) ? (bool)$validated['is_kitchen_category'] : false,
                'sort_order' => $maxOrder + 1,
                'is_active' => true,
            ]);
            
            DB::commit();

            // Broadcast update to POS and Kitchen
            $this->broadcastMenuUpdate();
            
            // Get updated stats
            $stats = $this->getStats();
            
            return response()->json([
                'success' => true,
                'message' => 'Category added successfully!',
                'category' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'is_active' => (bool)$category->is_active,
                    'is_kitchen_category' => (bool)$category->is_kitchen_category,
                    'sort_order' => $category->sort_order,
                ],
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create category: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create category: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified category
     */
    public function update(Request $request, Category $category)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
                'description' => 'nullable|string|max:500',
                'is_kitchen_category' => 'nullable|boolean',
            ]);
            
            $category->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'is_kitchen_category' => isset($validated['is_kitchen_category']) ? (bool)$validated['is_kitchen_category'] : $category->is_kitchen_category,
            ]);
            
            DB::commit();

            // Broadcast update to POS and Kitchen
            $this->broadcastMenuUpdate();
            
            return response()->json([
                'success' => true,
                'message' => 'Category updated successfully!',
                'category' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'is_active' => (bool)$category->is_active,
                    'is_kitchen_category' => (bool)$category->is_kitchen_category,
                    'sort_order' => $category->sort_order,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update category: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update category: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified category
     */
    public function destroy(Category $category)
    {
        try {
            DB::beginTransaction();

            // Check if category has items
            if ($category->items()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete category with existing menu items. Please delete or reassign items first.',
                ], 400);
            }
            
            $category->delete();
            
            DB::commit();

            // Broadcast update to POS and Kitchen
            $this->broadcastMenuUpdate();
            
            $stats = $this->getStats();
            
            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully!',
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete category: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete category: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle category active status
     */
    public function toggleStatus(Request $request, Category $category)
    {
        try {
            DB::beginTransaction();

            $category->update([
                'is_active' => !$category->is_active,
            ]);
            
            DB::commit();

            // Broadcast update to POS and Kitchen
            $this->broadcastMenuUpdate();
            
            $stats = $this->getStats();
            
            return response()->json([
                'success' => true,
                'message' => 'Category status updated!',
                'is_active' => $category->is_active,
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to toggle category status: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update category status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update category order (for drag & drop)
     */
    public function updateOrder(Request $request)
    {
        try {
            DB::beginTransaction();
            
            $request->validate([
                'categories' => 'required|array',
                'categories.*.id' => 'required|exists:categories,id',
                'categories.*.sort_order' => 'required|integer|min:1',
            ]);
            
            foreach ($request->categories as $categoryData) {
                Category::where('id', $categoryData['id'])
                    ->update(['sort_order' => $categoryData['sort_order']]);
            }
            
            DB::commit();

            // Broadcast update to POS and Kitchen
            $this->broadcastMenuUpdate();
            
            return response()->json([
                'success' => true,
                'message' => 'Order updated successfully!',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update category order: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order: ' . $e->getMessage()
            ], 500);
        }
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