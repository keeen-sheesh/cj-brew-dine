<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Category::class);

        $query = Category::with(['items' => function ($query) {
            $query->where('is_available', true);
        }])->orderBy('sort_order', 'asc');

        // Filter by type
        if ($request->has('is_kitchen_category')) {
            $query->where('is_kitchen_category', $request->boolean('is_kitchen_category'));
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search by name
        if ($request->has('search') && !empty($request->search)) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $categories = $query->paginate($request->get('per_page', 50));

        return response()->json($categories);
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(StoreCategoryRequest $request)
    {
        $this->authorize('create', Category::class);

        $category = Category::create($request->validated());

        return response()->json($category->load('items'), Response::HTTP_CREATED);
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category)
    {
        $this->authorize('view', $category);

        return response()->json($category->load(['items' => function ($query) {
            $query->where('is_available', true)
                  ->orderBy('sort_order', 'asc');
        }]));
    }

    /**
     * Update the specified category in storage.
     */
    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $this->authorize('update', $category);

        $category->update($request->validated());

        return response()->json($category->load('items'));
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(Category $category)
    {
        $this->authorize('delete', $category);

        // Check if category has items
        if ($category->items()->count() > 0) {
            return response()->json(
                ['message' => 'Cannot delete category with items'],
                Response::HTTP_CONFLICT
            );
        }

        $category->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Get all active categories with their items.
     */
    public function active(Request $request)
    {
        $this->authorize('viewAny', Category::class);

        $categories = Category::where('is_active', true)
            ->with(['items' => function ($query) {
                $query->where('is_available', true)
                      ->orderBy('sort_order', 'asc');
            }])
            ->orderBy('sort_order', 'asc')
            ->get();

        return response()->json($categories);
    }

    /**
     * Get kitchen categories with their items.
     */
    public function kitchen(Request $request)
    {
        $this->authorize('viewAny', Category::class);

        $categories = Category::where('is_kitchen_category', true)
            ->where('is_active', true)
            ->with(['items' => function ($query) {
                $query->where('is_available', true)
                      ->orderBy('sort_order', 'asc');
            }])
            ->orderBy('sort_order', 'asc')
            ->get();

        return response()->json($categories);
    }
}
