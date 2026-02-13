<?php
// app/Http\Controllers/Admin/FoodCategoryController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class FoodCategoryController extends Controller
{
    // This is for the main Foods page (returns Inertia)
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
                    'sort_order' => $category->sort_order,
                ];
            });
            
        $items = \App\Models\Item::with('category')
            ->orderBy('category_id')
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
                    'stock_quantity' => $item->stock_quantity ?? 0,
                    'low_stock_threshold' => $item->low_stock_threshold ?? 10,
                ];
            });
        
        // Get stats
        $total_categories = Category::count();
        $total_items = \App\Models\Item::count();
        $active_categories = Category::where('is_active', true)->count();
        $available_items = \App\Models\Item::where('is_available', true)->count();
        
        return Inertia::render('Admin/Foods', [
            'categories' => $categories,
            'items' => $items,
            'total_categories' => $total_categories,
            'total_items' => $total_items,
            'active_categories' => $active_categories,
            'available_items' => $available_items,
        ]);
    }

    // NEW METHOD: For API calls (returns JSON)
    public function apiIndex()
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
                    'sort_order' => $category->sort_order,
                ];
            });
            
        return response()->json([
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);
        
        // Get the max sort_order and add 1
        $maxOrder = Category::max('sort_order') ?? 0;
        
        $category = Category::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'sort_order' => $maxOrder + 1,
            'is_active' => true,
        ]);
        
        // Get updated stats
        $stats = $this->getStats();
        
        // Return JSON for AJAX requests
        return response()->json([
            'success' => true,
            'message' => 'Category added successfully!',
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'is_active' => (bool)$category->is_active,
                'sort_order' => $category->sort_order,
            ],
            'stats' => $stats,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);
        
        $category->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully!',
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'is_active' => (bool)$category->is_active,
                'sort_order' => $category->sort_order,
            ],
        ]);
    }

    public function destroy(Category $category)
    {
        // Check if category has items
        if ($category->items()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with existing menu items. Please delete or reassign items first.',
            ], 400);
        }
        
        $category->delete();
        
        $stats = $this->getStats();
        
        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully!',
            'stats' => $stats,
        ]);
    }

    public function toggleStatus(Request $request, Category $category)
    {
        $category->update([
            'is_active' => !$category->is_active,
        ]);
        
        $stats = $this->getStats();
        
        return response()->json([
            'success' => true,
            'message' => 'Category status updated!',
            'is_active' => $category->is_active,
            'stats' => $stats,
        ]);
    }

    public function updateOrder(Request $request)
    {
        $request->validate([
            'categories' => 'required|array',
            'categories.*.id' => 'required|exists:categories,id',
            'categories.*.sort_order' => 'required|integer|min:1',
        ]);
        
        try {
            DB::beginTransaction();
            
            foreach ($request->categories as $categoryData) {
                Category::where('id', $categoryData['id'])
                    ->update(['sort_order' => $categoryData['sort_order']]);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Order updated successfully!',
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function getStats()
    {
        return [
            'total_categories' => Category::count(),
            'total_items' => \App\Models\Item::count(),
            'active_categories' => Category::where('is_active', true)->count(),
            'available_items' => \App\Models\Item::where('is_available', true)->count(),
        ];
    }
}