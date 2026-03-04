<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ItemController extends Controller
{
    /**
     * Display a listing of items.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Item::class);

        $query = Item::with(['category', 'sizes'])
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc');

        // Filter by category
        if ($request->has('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }

        // Filter by availability
        if ($request->has('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        // Search by name only
        if ($request->has('search') && !empty($request->search)) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Include low stock items
        if ($request->has('low_stock') && $request->boolean('low_stock')) {
            $query->whereRaw('stock_quantity <= low_stock_threshold');
        }

        $items = $query->paginate($request->get('per_page', 15));

        return response()->json($items);
    }

    /**
     * Store a newly created item in storage.
     */
    public function store(StoreItemRequest $request)
    {
        $this->authorize('create', Item::class);

        $itemData = $request->validated();

        // Handle image upload if provided
        if ($request->hasFile('image')) {
            $itemData['image'] = $request->file('image')->store('items', 'public');
        }

        $item = Item::create($itemData);

        // Handle sizes if provided
        if ($request->has('sizes') && is_array($request->sizes)) {
            foreach ($request->sizes as $size) {
                $item->sizes()->attach($size['id'], [
                    'price' => $size['price'] ?? null,
                    'additional_price' => $size['additional_price'] ?? null,
                ]);
            }
        }

        return response()->json($item->load(['category', 'sizes']), Response::HTTP_CREATED);
    }

    /**
     * Display the specified item.
     */
    public function show(Item $item)
    {
        $this->authorize('view', $item);

        return response()->json($item->load(['category', 'sizes', 'saleItems']));
    }

    /**
     * Update the specified item in storage.
     */
    public function update(UpdateItemRequest $request, Item $item)
    {
        $this->authorize('update', $item);

        $itemData = $request->validated();

        // Handle image upload if provided
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($item->image) {
                \Storage::disk('public')->delete($item->image);
            }
            $itemData['image'] = $request->file('image')->store('items', 'public');
        }

        $item->update($itemData);

        // Handle sizes if provided
        if ($request->has('sizes')) {
            $item->sizes()->sync(
                collect($request->sizes)->mapWithKeys(function ($size) {
                    return [
                        $size['id'] => [
                            'price' => $size['price'] ?? null,
                            'additional_price' => $size['additional_price'] ?? null,
                        ]
                    ];
                })->toArray()
            );
        }

        return response()->json($item->load(['category', 'sizes']));
    }

    /**
     * Remove the specified item from storage.
     */
    public function destroy(Item $item)
    {
        $this->authorize('delete', $item);

        if ($item->image) {
            \Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Get low stock items.
     */
    public function lowStock(Request $request)
    {
        $this->authorize('viewAny', Item::class);

        $items = Item::whereRaw('stock_quantity <= low_stock_threshold')
            ->with('category')
            ->orderBy('stock_quantity', 'asc')
            ->paginate($request->get('per_page', 15));

        return response()->json($items);
    }

    /**
     * Update item stock quantity.
     */
    public function updateStock(Request $request, Item $item)
    {
        $this->authorize('updateStock', $item);

        $request->validate([
            'quantity' => ['required', 'integer'],
        ]);

        $item->update(['stock_quantity' => $request->quantity]);

        return response()->json($item);
    }

    /**
     * Get items by category.
     */
    public function byCategory(Category $category, Request $request)
    {
        $this->authorize('view', $category);

        $items = $category->items()
            ->with('sizes')
            ->where('is_available', true)
            ->orderBy('sort_order', 'asc')
            ->paginate($request->get('per_page', 15));

        return response()->json($items);
    }
}
