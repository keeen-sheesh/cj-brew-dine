<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreIngredientRequest;
use App\Http\Requests\UpdateIngredientRequest;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class IngredientController extends Controller
{
    /**
     * Display a listing of ingredients.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Ingredient::class);

        $query = Ingredient::with('items');

        // Search by name
        if ($request->has('search') && !empty($request->search)) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter by low stock
        if ($request->has('low_stock') && $request->boolean('low_stock')) {
            $query->whereRaw('quantity <= min_stock');
        }

        // Filter by unit
        if ($request->has('unit') && !empty($request->unit)) {
            $query->where('unit', $request->unit);
        }

        $ingredients = $query->orderBy('name', 'asc')
            ->paginate($request->get('per_page', 15));

        return response()->json($ingredients);
    }

    /**
     * Store a newly created ingredient in storage.
     */
    public function store(StoreIngredientRequest $request)
    {
        $this->authorize('create', Ingredient::class);

        $ingredient = Ingredient::create($request->validated());

        return response()->json($ingredient->load('items'), Response::HTTP_CREATED);
    }

    /**
     * Display the specified ingredient.
     */
    public function show(Ingredient $ingredient)
    {
        $this->authorize('view', $ingredient);

        return response()->json($ingredient->load('items'));
    }

    /**
     * Update the specified ingredient in storage.
     */
    public function update(UpdateIngredientRequest $request, Ingredient $ingredient)
    {
        $this->authorize('update', $ingredient);

        $ingredient->update($request->validated());

        return response()->json($ingredient->load('items'));
    }

    /**
     * Remove the specified ingredient from storage.
     */
    public function destroy(Ingredient $ingredient)
    {
        $this->authorize('delete', $ingredient);

        $ingredient->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Get low stock ingredients.
     */
    public function lowStock(Request $request)
    {
        $this->authorize('viewAny', Ingredient::class);

        $ingredients = Ingredient::whereRaw('quantity <= min_stock')
            ->orderBy('quantity', 'asc')
            ->paginate($request->get('per_page', 15));

        return response()->json($ingredients);
    }

    /**
     * Update ingredient stock quantity.
     */
    public function updateStock(Request $request, Ingredient $ingredient)
    {
        $this->authorize('updateStock', $ingredient);

        $request->validate([
            'quantity' => ['required', 'numeric', 'min:0'],
        ]);

        $ingredient->update(['quantity' => $request->quantity]);

        return response()->json($ingredient);
    }

    /**
     * Get unique units.
     */
    public function units()
    {
        $this->authorize('viewAny', Ingredient::class);

        $units = Ingredient::distinct()
            ->pluck('unit')
            ->filter()
            ->sort()
            ->values();

        return response()->json($units);
    }
}
