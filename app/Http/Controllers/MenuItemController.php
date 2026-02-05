<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Restobar;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MenuItemController extends Controller
{
    // Display all menu items
    public function index()
    {
        // Get menu items for the user's restobar
        $menuItems = MenuItem::where('restobar_id', auth()->user()->restobar_id)
            ->latest()
            ->get();
            
        return Inertia::render('Menu/Index', [
            'menuItems' => $menuItems,
        ]);
    }

    // Show create form
    public function create()
    {
        return Inertia::render('Menu/Create');
    }

    // Store new menu item
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string|max:100',
            'stock' => 'required|integer|min:0',
            'image_url' => 'nullable|url',
        ]);

        // Add restobar_id and create item
        $validated['restobar_id'] = auth()->user()->restobar_id;
        $validated['is_available'] = $validated['stock'] > 0;
        
        MenuItem::create($validated);

        return redirect()->route('menu.index')
            ->with('success', 'Menu item created successfully!');
    }

    // Show edit form
    public function edit(MenuItem $menuItem)
    {
        // Check if user owns this menu item
        if ($menuItem->restobar_id !== auth()->user()->restobar_id) {
            abort(403);
        }

        return Inertia::render('Menu/Edit', [
            'menuItem' => $menuItem,
        ]);
    }

    // Update menu item
    public function update(Request $request, MenuItem $menuItem)
    {
        // Check if user owns this menu item
        if ($menuItem->restobar_id !== auth()->user()->restobar_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string|max:100',
            'stock' => 'required|integer|min:0',
            'image_url' => 'nullable|url',
            'is_available' => 'boolean',
        ]);

        $menuItem->update($validated);

        return redirect()->route('menu.index')
            ->with('success', 'Menu item updated successfully!');
    }

    // Delete menu item
    public function destroy(MenuItem $menuItem)
    {
        // Check if user owns this menu item
        if ($menuItem->restobar_id !== auth()->user()->restobar_id) {
            abort(403);
        }

        $menuItem->delete();

        return redirect()->route('menu.index')
            ->with('success', 'Menu item deleted successfully!');
    }
}