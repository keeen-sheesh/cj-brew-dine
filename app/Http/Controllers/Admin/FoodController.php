<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FoodController extends Controller
{
    public function index()
    {
        $categories = Category::orderBy('name')->get();
        $items = Item::with('category')
            ->orderBy('name')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'description' => $item->description,
                    'price' => $item->price,
                    'category_id' => $item->category_id,
                    'category_name' => $item->category->name,
                    'is_available' => $item->is_available
                ];
            });
        
        // Get statistics
        $total_categories = Category::count();
        $total_items = Item::count();
        $active_categories = Category::where('is_active', true)->count();
        $available_items = Item::where('is_available', true)->count();
        
        return Inertia::render('Admin/Foods/Index', [
            'categories' => $categories,
            'items' => $items,
            'stats' => [
                'total_categories' => $total_categories,
                'total_items' => $total_items,
                'active_categories' => $active_categories,
                'available_items' => $available_items
            ]
        ]);
    }
    
    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|unique:categories|max:255',
            'description' => 'nullable'
        ]);
        
        try {
            DB::beginTransaction();
            
            $category = Category::create([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => true
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Category added successfully',
                'category' => $category,
                'stats' => $this->getStats()
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to add category: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function updateCategory(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable'
        ]);
        
        try {
            $category->update([
                'name' => $request->name,
                'description' => $request->description
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Category updated successfully',
                'category' => $category
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update category: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function destroyCategory(Category $category)
    {
        try {
            if ($category->items()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete category with existing menu items'
                ], 400);
            }
            
            $category->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully',
                'stats' => $this->getStats()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete category: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function storeItem(Request $request)
    {
        $request->validate([
            'name' => 'required|max:255',
            'description' => 'nullable',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id'
        ]);
        
        try {
            DB::beginTransaction();
            
            $item = Item::create([
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'category_id' => $request->category_id,
                'is_available' => true
            ]);
            
            $item->load('category');
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Menu item added successfully',
                'item' => $item,
                'stats' => $this->getStats()
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to add item: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function updateItem(Request $request, Item $item)
    {
        $request->validate([
            'name' => 'required|max:255|unique:items,name,' . $item->id,
            'description' => 'nullable',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id'
        ]);
        
        try {
            $item->update([
                'name' => $request->name,
                'description' => $request->description,
                'price' => $request->price,
                'category_id' => $request->category_id
            ]);
            
            $item->load('category');
            
            return response()->json([
                'success' => true,
                'message' => 'Menu item updated successfully',
                'item' => $item
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update item: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function destroyItem(Item $item)
    {
        try {
            $item->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Menu item deleted successfully',
                'stats' => $this->getStats()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete item: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function toggleCategory(Category $category)
    {
        try {
            $category->update([
                'is_active' => !$category->is_active
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Category status updated',
                'is_active' => $category->is_active,
                'stats' => $this->getStats()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle category: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function toggleItem(Item $item)
    {
        try {
            $item->update([
                'is_available' => !$item->is_available
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Item availability updated',
                'is_available' => $item->is_available,
                'stats' => $this->getStats()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle item: ' . $e->getMessage()
            ], 500);
        }
    }
    
    private function getStats()
    {
        return [
            'total_categories' => Category::count(),
            'total_items' => Item::count(),
            'active_categories' => Category::where('is_active', true)->count(),
            'available_items' => Item::where('is_available', true)->count()
        ];
    }
}