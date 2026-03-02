<?php
// app/Http/Controllers/Admin/InventoryController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class InventoryController extends Controller
{
    /**
     * Display inventory management page
     */
    public function index()
    {
        $ingredients = Ingredient::with('items')->orderBy('name')->get();
        $items = Item::with('category', 'ingredients')->orderBy('name')->get();
        
        // Get items that need recipe setup
        $itemsNeedingRecipe = Item::whereDoesntHave('ingredients')->count();
        
        // Get low stock ingredients
        $lowStockIngredients = Ingredient::whereRaw('quantity <= min_stock')->count();
        
        return Inertia::render('Admin/Inventory/Index', [
            'ingredients' => $ingredients,
            'items' => $items,
            'stats' => [
                'total_ingredients' => $ingredients->count(),
                'total_items_with_recipe' => Item::has('ingredients')->count(),
                'items_needing_recipe' => $itemsNeedingRecipe,
                'low_stock_ingredients' => $lowStockIngredients,
            ]
        ]);
    }

    /**
     * Get ingredients for dropdown (API)
     */
    public function getIngredients()
    {
        $ingredients = Ingredient::orderBy('name')
            ->get(['id', 'name', 'unit', 'is_dry', 'quantity', 'min_stock', 'cost_per_unit']);
        
        return response()->json([
            'success' => true,
            'ingredients' => $ingredients
        ]);
    }

    /**
     * Get items with their recipes (API)
     */
    public function getItemsWithRecipes()
    {
        $items = Item::with(['category', 'ingredients' => function($query) {
            $query->orderBy('name');
        }])->orderBy('name')->get();
        
        return response()->json([
            'success' => true,
            'items' => $items
        ]);
    }

    /**
     * Get recipe for a specific item
     */
    public function getItemRecipe(Item $item)
    {
        $item->load(['category', 'ingredients' => function($query) {
            $query->orderBy('name');
        }]);
        
        return response()->json([
            'success' => true,
            'item' => $item
        ]);
    }

    /**
     * Save recipe for an item
     */
    public function saveRecipe(Request $request, Item $item)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'ingredients' => 'required|array',
                'ingredients.*.id' => 'required|exists:ingredients,id',
                'ingredients.*.quantity_required' => 'required|numeric|min:0.001',
                'ingredients.*.unit' => 'nullable|string|max:20',
                'ingredients.*.notes' => 'nullable|string|max:255',
            ]);

            // Prepare sync data
            $syncData = [];
            foreach ($validated['ingredients'] as $ingredient) {
                $syncData[$ingredient['id']] = [
                    'quantity_required' => $ingredient['quantity_required'],
                    'unit' => $ingredient['unit'] ?? null,
                    'notes' => $ingredient['notes'] ?? null,
                ];
            }

            // Sync ingredients
            $item->ingredients()->sync($syncData);

            // Update has_recipe flag
            $item->update(['has_recipe' => true]);

            DB::commit();

            // Reload with relationships
            $item->load(['category', 'ingredients']);

            return response()->json([
                'success' => true,
                'message' => 'Recipe saved successfully!',
                'item' => $item
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save recipe: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save recipe: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if item can be made with current inventory
     */
    public function checkAvailability(Item $item, $quantity = 1)
    {
        $item->load('ingredients');
        
        $missingIngredients = [];
        $insufficientIngredients = [];
        
        foreach ($item->ingredients as $ingredient) {
            $required = $ingredient->pivot->quantity_required * $quantity;
            
            if ($ingredient->quantity < $required) {
                $insufficientIngredients[] = [
                    'name' => $ingredient->name,
                    'required' => $required,
                    'available' => $ingredient->quantity,
                    'unit' => $ingredient->unit
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'available' => count($insufficientIngredients) === 0,
            'insufficient_ingredients' => $insufficientIngredients,
            'missing_ingredients' => $missingIngredients
        ]);
    }

    /**
     * Bulk update ingredient stock
     */
    public function updateStock(Request $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'ingredients' => 'required|array',
                'ingredients.*.id' => 'required|exists:ingredients,id',
                'ingredients.*.quantity' => 'required|numeric|min:0',
                'ingredients.*.notes' => 'nullable|string',
            ]);

            foreach ($validated['ingredients'] as $data) {
                $ingredient = Ingredient::find($data['id']);
                $oldQuantity = $ingredient->quantity;
                $ingredient->quantity = $data['quantity'];
                $ingredient->save();

                // Log stock adjustment
                Log::info('Stock adjusted', [
                    'ingredient' => $ingredient->name,
                    'old' => $oldQuantity,
                    'new' => $data['quantity'],
                    'notes' => $data['notes'] ?? null,
                    'user' => auth()->id()
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stock updated successfully!'
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
     * Get low stock alerts
     */
    public function getLowStockAlerts()
    {
        $lowStock = Ingredient::whereRaw('quantity <= min_stock')
            ->orderByRaw('(quantity / min_stock) asc')
            ->get();
        
        $outOfStock = Ingredient::where('quantity', '<=', 0)
            ->orderBy('name')
            ->get();
        
        return response()->json([
            'success' => true,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
            'total_alerts' => $lowStock->count() + $outOfStock->count()
        ]);
    }

    /**
     * Migrate existing items to use ingredients
     */
    public function migrateItems(Request $request)
    {
        try {
            DB::beginTransaction();

            $items = Item::whereDoesntHave('ingredients')->get();
            $migrated = 0;
            $skipped = 0;

            foreach ($items as $item) {
                // Check if item has any ingredient data in old format
                if (!empty($item->ingredients) && is_string($item->ingredients)) {
                    // Parse old ingredients string (if exists)
                    $ingredientsList = explode(',', $item->ingredients);
                    
                    // Try to match with actual ingredients
                    foreach ($ingredientsList as $ingredientName) {
                        $ingredientName = trim($ingredientName);
                        $ingredient = Ingredient::where('name', 'LIKE', "%{$ingredientName}%")->first();
                        
                        if ($ingredient) {
                            // Add with default quantity (1)
                            $item->ingredients()->attach($ingredient->id, [
                                'quantity_required' => 1,
                                'notes' => 'Auto-migrated from old data'
                            ]);
                        }
                    }
                    
                    $migrated++;
                } else {
                    $skipped++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Migration complete! {$migrated} items migrated, {$skipped} skipped.",
                'migrated' => $migrated,
                'skipped' => $skipped
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Migration failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Migration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new ingredient
     */
    public function storeIngredient(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:ingredients,name',
                'unit' => 'required|string|max:50',
                'is_dry' => 'required|boolean',
                'quantity' => 'required|numeric|min:0',
                'min_stock' => 'required|numeric|min:0',
                'cost_per_unit' => 'required|numeric|min:0',
            ]);

            $ingredient = Ingredient::create($validated);

            Log::info('Ingredient created', [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'quantity' => $ingredient->quantity,
                'user' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ingredient added successfully!',
                'ingredient' => $ingredient
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create ingredient: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to add ingredient: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing ingredient
     */
    public function updateIngredient(Request $request, Ingredient $ingredient)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:ingredients,name,' . $ingredient->id,
                'unit' => 'required|string|max:50',
                'is_dry' => 'required|boolean',
                'quantity' => 'required|numeric|min:0',
                'min_stock' => 'required|numeric|min:0',
                'cost_per_unit' => 'required|numeric|min:0',
            ]);


            $oldQuantity = $ingredient->quantity;
            $ingredient->update($validated);

            Log::info('Ingredient updated', [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'old_quantity' => $oldQuantity,
                'new_quantity' => $ingredient->quantity,
                'user' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ingredient updated successfully!',
                'ingredient' => $ingredient
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update ingredient: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update ingredient: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an ingredient
     */
    public function deleteIngredient(Ingredient $ingredient)
    {
        try {
            $ingredientName = $ingredient->name;
            
            // Remove ingredient associations with items
            $ingredient->items()->detach();
            
            // Delete the ingredient
            $ingredient->delete();

            Log::info('Ingredient deleted', [
                'name' => $ingredientName,
                'user' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ingredient deleted successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete ingredient: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete ingredient: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk update ingredient stock
     */
    public function bulkUpdateStock(Request $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'updates' => 'required|array',
                'updates.*.id' => 'required|exists:ingredients,id',
                'updates.*.quantity' => 'required|numeric|min:0',
            ]);

            $updatedIngredients = [];

            foreach ($validated['updates'] as $update) {
                $ingredient = Ingredient::find($update['id']);
                $oldQuantity = $ingredient->quantity;
                $ingredient->quantity = $update['quantity'];
                $ingredient->save();

                Log::info('Stock bulk updated', [
                    'ingredient' => $ingredient->name,
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $ingredient->quantity,
                    'user' => auth()->id()
                ]);

                $updatedIngredients[] = $ingredient;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stock updated successfully!',
                'ingredients' => $updatedIngredients
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to bulk update stock: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update stock: ' . $e->getMessage()
            ], 500);
        }
    }
}
