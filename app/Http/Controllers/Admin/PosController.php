<?php
// app/Http/Controllers/Admin/PosController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Item;
use App\Models\PaymentMethod;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Auth;

class PosController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::with(['items' => function($query) {
            $query->where('is_available', true)
                  ->orderBy('sort_order', 'asc')
                  ->orderBy('name');
        }])
        ->where('is_active', true)
        ->orderBy('sort_order', 'asc')
        ->orderBy('name')
        ->get();

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->orderBy('name')
            ->get();

        // Get ready orders for payment
        $readyOrders = Sale::with(['customer', 'saleItems.item'])
            ->where('status', 'ready')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function($order) {
                $order->items_list = $order->saleItems->map(function($saleItem) {
                    return $saleItem->item->name ?? 'Unknown Item';
                })->implode(', ');
                return $order;
            });

        // Get pending/preparing orders (include kitchen status)
        $pendingOrders = Sale::with(['customer', 'paymentMethod', 'saleItems.item.category'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function($order) {
                $order->items_list = $order->saleItems->map(function($saleItem) {
                    return $saleItem->item->name ?? 'Unknown Item';
                })->implode(', ');
                $order->formatted_total = '₱' . number_format($order->total_amount, 2);
                $order->formatted_time = $order->created_at->format('h:i A');
                
                // check against the database instead of looping manually; this
                // avoids edge cases where the category relation might be null or
                // the value has an unexpected type
                $hasKitchenItems = SaleItem::where('sale_id', $order->id)
                    ->whereHas('item.category', function($q) {
                        $q->where('is_kitchen_category', 1);
                    })
                    ->exists();

                $order->has_kitchen_items = $hasKitchenItems;
                $order->kitchen_status = $order->kitchen_status;
                $order->payment_method_name = $order->paymentMethod ? $order->paymentMethod->name : null;
                $order->room_number = $order->room_number ?? null;
                
                return $order;
            });

        // Get success/error messages from session
        $success = session('success');
        $error = session('error');
        $orderData = session('order_data');

        // Get menu last updated timestamp for real-time checks
        $menuLastUpdated = cache()->get('menu_last_updated', 0);

        return Inertia::render('Admin/POS', [
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
            'readyOrders' => $readyOrders,
            'pendingOrders' => $pendingOrders,
            'appName' => config('app.name', 'CJ Brew & Dine'),
            'menuLastUpdated' => $menuLastUpdated,
            'flash' => [
                'success' => $success,
                'error' => $error,
                'order_data' => $orderData,
            ],
        ]);
    }

    // 🔥 REAL-TIME: Get menu updates (2-second polling with cache check)
    public function getMenuUpdates(Request $request)
    {
        $lastUpdate = $request->get('last_update', 0);
        $currentUpdate = cache()->get('menu_last_updated', 0);

        // If no changes since last check, return early
        if ($lastUpdate > 0 && $currentUpdate <= $lastUpdate) {
            return response()->json([
                'success' => true,
                'updated' => false,
                'timestamp' => now()->toDateTimeString(),
            ]);
        }

        $categories = Category::with(['items' => function($query) {
            $query->where('is_available', true)
                  ->orderBy('sort_order', 'asc')
                  ->orderBy('name');
        }])
        ->where('is_active', true)
        ->orderBy('sort_order', 'asc')
        ->orderBy('name')
        ->get();

        return response()->json([
            'success' => true,
            'updated' => true,
            'categories' => $categories,
            'timestamp' => now()->toDateTimeString(),
            'menu_last_updated' => $currentUpdate,
        ]);
    }

    // 🔥 REAL-TIME: Get order updates (3-second polling)
    public function getOrderUpdates(Request $request)
    {
        $orders = Sale::with(['customer', 'paymentMethod', 'saleItems.item.category'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
        
        $pendingOrders = [];
        
        foreach ($orders as $order) {
            $itemsList = $order->saleItems->map(function($saleItem) {
                return $saleItem->item->name ?? 'Unknown Item';
            })->implode(', ');
            
            // Check if order has kitchen items using DB query
            $hasKitchenItems = SaleItem::where('sale_id', $order->id)
                ->whereHas('item.category', function($q) {
                    $q->where('is_kitchen_category', 1);
                })
                ->exists();
            
            // Get payment method name
            $paymentMethodName = $order->paymentMethod ? $order->paymentMethod->name : null;
            
            $pendingOrders[] = [
                'id' => $order->id,
                'total_amount' => $order->total_amount,
                'status' => $order->status,
                'kitchen_status' => $order->kitchen_status,
                'has_kitchen_items' => $hasKitchenItems,
                'created_at' => $order->created_at,
                'customer_name' => $order->customer_name,
                'payment_method_name' => $paymentMethodName,
                'room_number' => $order->room_number ?? null,
                'items_list' => $itemsList,
                'formatted_total' => '₱' . number_format($order->total_amount, 2),
                'formatted_time' => $order->created_at->format('h:i A'),
            ];
        }

        return response()->json([
            'success' => true,
            'pending_orders' => $pendingOrders,
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    // 🔥 REAL-TIME: Full menu data for manual refresh
    public function getMenuData(Request $request)
    {
        $categories = Category::with(['items' => function($query) {
            $query->where('is_available', true)
                  ->orderBy('sort_order', 'asc')
                  ->orderBy('name');
        }])
        ->where('is_active', true)
        ->orderBy('sort_order', 'asc')
        ->orderBy('name')
        ->get();

        return response()->json([
            'success' => true,
            'categories' => $categories,
            'menu_last_updated' => cache()->get('menu_last_updated', 0),
        ]);
    }

    // 🔥 REAL-TIME: Full order data for manual refresh
    public function getOrderData(Request $request)
    {
        $orders = Sale::with(['customer', 'paymentMethod', 'saleItems.item.category'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
        
        $pendingOrders = [];
        
        foreach ($orders as $order) {
            $itemsList = $order->saleItems->map(function($saleItem) {
                return $saleItem->item->name ?? 'Unknown Item';
            })->implode(', ');
            
            // Check if order has kitchen items using a dedicated query
            $hasKitchenItems = SaleItem::where('sale_id', $order->id)
                ->whereHas('item.category', function($q) {
                    $q->where('is_kitchen_category', 1);
                })
                ->exists();
            
            // Get payment method name
            $paymentMethodName = $order->paymentMethod ? $order->paymentMethod->name : null;
            
            $pendingOrders[] = [
                'id' => $order->id,
                'total_amount' => $order->total_amount,
                'status' => $order->status,
                'kitchen_status' => $order->kitchen_status,
                'has_kitchen_items' => $hasKitchenItems,
                'created_at' => $order->created_at,
                'customer_name' => $order->customer_name,
                'payment_method_name' => $paymentMethodName,
                'room_number' => $order->room_number ?? null,
                'items_list' => $itemsList,
                'formatted_total' => '₱' . number_format($order->total_amount, 2),
                'formatted_time' => $order->created_at->format('h:i A'),
            ];
        }

        return response()->json([
            'success' => true,
            'pending_orders' => $pendingOrders,
        ]);
    }

    public function store(Request $request)
{
    // Log the raw request first
    Log::info('========== POS ORDER CREATION STARTED ==========');
    Log::info('All request data:', $request->all());
    Log::info('room_number from request:', ['room_number' => $request->room_number]);
    
    try {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.name' => 'required|string',
            'items.*.notes' => 'nullable|string',
            'order_type' => 'required|in:dine_in,takeout,delivery',
            'customer_name' => 'nullable|string|max:255',
            'room_number' => 'nullable|string|max:20',
            'people_count' => 'required|integer|min:1|max:20',
            'cards_presented' => 'required|integer|min:0|max:20',
            'customer_phone' => 'nullable|string|max:20',
            'customer_address' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
            'discount_type' => 'nullable|in:none,percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'payment_method_id' => 'required|exists:payment_methods,id',
        ]);

        Log::info('========== AFTER VALIDATION ==========');
        Log::info('validated room_number:', ['room_number' => $validated['room_number'] ?? null]);
        Log::info('All validated data:', $validated);

        DB::beginTransaction();

        $subtotal = collect($validated['items'])->sum(function($item) {
            return $item['price'] * $item['quantity'];
        });

        Log::info('Subtotal calculated:', ['subtotal' => $subtotal]);

        // Check stock availability for all items
        foreach ($validated['items'] as $item) {
            $dbItem = Item::find($item['id']);
            if ($dbItem && $dbItem->stock_quantity !== null) {
                if ($dbItem->stock_quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for {$dbItem->name}. Available: {$dbItem->stock_quantity}");
                }
            }
        }

        // Card discount (20% per card)
        $cardDiscount = 0;
        if ($validated['cards_presented'] > 0 && $validated['people_count'] > 0) {
            $cardDiscount = ($subtotal * 0.20) / $validated['people_count'] * $validated['cards_presented'];
            $cardDiscount = round($cardDiscount, 2);
        }

        // Additional discount
        $additionalDiscount = 0;
        if (isset($validated['discount_type']) && $validated['discount_type'] !== 'none' && $validated['discount_value'] > 0) {
            if ($validated['discount_type'] === 'percentage') {
                $additionalDiscount = ($subtotal * $validated['discount_value']) / 100;
            } elseif ($validated['discount_type'] === 'fixed') {
                $additionalDiscount = $validated['discount_value'];
            }
            $additionalDiscount = round($additionalDiscount, 2);
        }

        $totalDiscount = $cardDiscount + $additionalDiscount;
        $totalAmount = $subtotal - $totalDiscount;

        // determine which item IDs are considered kitchen items using a single query
        $itemIds = collect($validated['items'])->pluck('id')->toArray();
        
        Log::info('Item IDs from order:', ['item_ids' => $itemIds]);
        
        $kitchenItemIds = Item::whereIn('id', $itemIds)
            ->whereHas('category', function($query) {
                $query->where('is_kitchen_category', 1);
            })
            ->pluck('id')
            ->toArray();

        $hasKitchenItems = count($kitchenItemIds) > 0;
        
        // Get category info for each item to debug
        $itemsWithCategories = Item::with('category')
            ->whereIn('id', $itemIds)
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'category' => $item->category ? $item->category->name : 'no category',
                    'is_kitchen_category' => $item->category ? $item->category->is_kitchen_category : false
                ];
            });

        Log::info('Items with categories:', ['items' => $itemsWithCategories->toArray()]);
        Log::info('Kitchen item detection', [
            'item_ids' => $itemIds,
            'kitchen_item_ids' => $kitchenItemIds,
            'has_kitchen_items' => $hasKitchenItems,
        ]);

        // Determine initial status based on kitchen items
        $initialStatus = $hasKitchenItems ? 'pending' : 'completed';
        $initialKitchenStatus = $hasKitchenItems ? 'pending' : null;

        Log::info('Initial status determination:', [
            'has_kitchen_items' => $hasKitchenItems,
            'initialStatus' => $initialStatus,
            'initialKitchenStatus' => $initialKitchenStatus
        ]);

        // Log before creating sale
        Log::info('========== BEFORE SALE CREATE ==========');
        Log::info('room_number to save:', ['room_number' => $validated['room_number'] ?? null]);

        $sale = Sale::create([
            'user_id' => Auth::id(),
            'subtotal' => $subtotal,
            'discount_amount' => $totalDiscount,
            'total_amount' => $totalAmount,
            'status' => $initialStatus,
            'kitchen_status' => $initialKitchenStatus,
            'order_type' => $validated['order_type'],
            'people_count' => $validated['people_count'],
            'cards_presented' => $validated['cards_presented'],
            'customer_name' => $validated['customer_name'] ?? null,
            'room_number' => $validated['room_number'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'customer_address' => $validated['customer_address'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'discount_type' => $validated['discount_type'] ?? 'none',
            'discount_value' => $validated['discount_value'] ?? 0,
            'payment_method_id' => $validated['payment_method_id'],
            'paid_at' => !$hasKitchenItems ? now() : null,
        ]);

        // Log after creating sale
        Log::info('========== AFTER SALE CREATE ==========');
        Log::info('Created sale:', [
            'id' => $sale->id,
            'room_number' => $sale->room_number,
            'customer_name' => $sale->customer_name,
            'status' => $sale->status,
            'kitchen_status' => $sale->kitchen_status
        ]);

        foreach ($validated['items'] as $item) {
            $itemModel = Item::with('category')->find($item['id']);
            // treat as kitchen item if the id is in the pre-fetched list
            $isKitchenItem = in_array($item['id'], $kitchenItemIds, true);

            $saleItemData = [
                'sale_id' => $sale->id,
                'item_id' => $item['id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['price'],
                'total_price' => $item['price'] * $item['quantity'],
                'special_instructions' => $item['notes'] ?? null,
            ];

            if ($isKitchenItem) {
                $saleItemData['kitchen_status'] = 'pending';
            }

            $saleItem = SaleItem::create($saleItemData);
            
            Log::info('Created sale item:', [
                'sale_item_id' => $saleItem->id,
                'item_id' => $item['id'],
                'item_name' => $item['name'],
                'is_kitchen_item' => $isKitchenItem,
                'kitchen_status' => $saleItem->kitchen_status ?? 'not set'
            ]);

            // Update stock quantity if item has stock tracking
            if ($itemModel && $itemModel->stock_quantity !== null) {
                $itemModel->decrement('stock_quantity', $item['quantity']);
                
                // Check if stock is now low
                if ($itemModel->stock_quantity <= ($itemModel->low_stock_threshold ?? 5)) {
                    Log::warning("Low stock alert: {$itemModel->name} has only {$itemModel->stock_quantity} left");
                }
            }
        }

        
        // after sale items are created double-check the status in case the
        // initial detection missed something (e.g. category relationship was
        // null or cast weirdly). this extra query guarantees the order will
        // appear on the kitchen display whenever any of its items are
        // flagged as kitchen items.
        if (!$hasKitchenItems) {
            $actualKitchen = SaleItem::where('sale_id', $sale->id)
                ->whereHas('item.category', function($q) {
                    $q->where('is_kitchen_category', 1);
                })
                ->exists();

            if ($actualKitchen) {
                $hasKitchenItems = true;
                $sale->update([
                    'status' => 'pending',
                    'kitchen_status' => 'pending',
                    'paid_at' => null, // make sure it's not marked paid prematurely
                ]);
                Log::info('Re‑flagged order as having kitchen items after creation', [
                    'order_id' => $sale->id,
                    'new_status' => 'pending',
                    'new_kitchen_status' => 'pending'
                ]);
            }
        }

        // After creating sale items, deduct inventory
        try {
            $this->deductInventory($sale);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Inventory deduction failed: ' . $e->getMessage());
            throw $e; // Re-throw to be caught by outer catch
        }

        DB::commit();

        // Update menu last updated timestamp
        cache()->put('menu_last_updated', time(), 3600);

        $successMessage = '✅ Order #' . $sale->id . ' placed successfully!';
        if ($hasKitchenItems) {
            $successMessage .= " Kitchen items sent to kitchen.";
        } else {
            $successMessage .= " Order completed.";
        }

        Log::info('========== ORDER CREATED SUCCESSFULLY ==========', [
            'order_id' => $sale->id,
            'final_status' => $sale->status,
            'final_kitchen_status' => $sale->kitchen_status,
            'has_kitchen_items' => $hasKitchenItems
        ]);

        return redirect()->route('admin.pos.index')->with([
            'success' => $successMessage,
            'order_data' => [
                'order_id' => $sale->id,
                'total' => $totalAmount,
                'discount' => $totalDiscount,
                'order_number' => 'ORD-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT),
                'has_kitchen_items' => $hasKitchenItems,
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        
        Log::error('========== ORDER FAILED ==========');
        Log::error('Error: ' . $e->getMessage());
        Log::error('Trace: ' . $e->getTraceAsString());
        
        return redirect()->route('admin.pos.index')->with([
            'error' => '❌ Failed to place order: ' . $e->getMessage()
        ]);
    }
}
    public function markAsPaid(Request $request, Sale $sale)
    {
        try {
            DB::beginTransaction();

            $updateData = [
                'status' => 'completed',
                'payment_method_id' => $request->payment_method_id ?? 1,
            ];
            
            // Only update paid_at if column exists
            if (Schema::hasColumn('sales', 'paid_at')) {
                $updateData['paid_at'] = now();
            }
            
            $sale->update($updateData);

            DB::commit();

            // Update menu last updated timestamp to trigger POS refresh
            cache()->put('menu_last_updated', time(), 3600);

            return redirect()->route('admin.pos.index')->with('success', '✅ Order #' . $sale->id . ' marked as paid successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->route('admin.pos.index')->with('error', '❌ Failed to mark as paid: ' . $e->getMessage());
        }
    }

    public function markAsReady(Request $request, Sale $sale)
    {
        try {
            $sale->update([
                'status' => 'ready',
            ]);

            return redirect()->route('admin.pos.index')->with('success', '✅ Order #' . $sale->id . ' marked as ready for payment!');

        } catch (\Exception $e) {
            return redirect()->route('admin.pos.index')->with('error', '❌ Failed to mark as ready: ' . $e->getMessage());
        }
    }

    public function markAsPreparing(Request $request, Sale $sale)
    {
        try {
            $sale->update([
                'status' => 'preparing',
                'kitchen_status' => 'preparing',
            ]);

            return redirect()->route('admin.pos.index')->with('success', '✅ Order #' . $sale->id . ' marked as preparing!');

        } catch (\Exception $e) {
            return redirect()->route('admin.pos.index')->with('error', '❌ Failed to mark as preparing: ' . $e->getMessage());
        }
    }

    /**
     * Kitchen marks order as ready
     */
    public function kitchenReady(Request $request, Sale $order)
    {
        try {
            DB::beginTransaction();

            $order->update([
                'status' => 'ready',
                'kitchen_status' => 'ready',
            ]);

            // Update all kitchen items to ready
            $kitchenItems = SaleItem::where('sale_id', $order->id)
                ->whereHas('item.category', function($query) {
                    $query->where('is_kitchen_category', true);
                })
                ->get();
                
            foreach ($kitchenItems as $item) {
                $item->update([
                    'kitchen_status' => 'ready',
                ]);
            }

            DB::commit();

            // Update cache to trigger POS refresh
            cache()->put('menu_last_updated', time(), 3600);

            return response()->json([
                'success' => true,
                'message' => 'Order #' . $order->id . ' is ready'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Kitchen ready failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete an order (mark as completed) - FIXED for database compatibility
     */
    public function complete(Request $request, Sale $order)
    {
        try {
            Log::info('Starting complete order', [
                'order_id' => $order->id, 
                'current_status' => $order->status,
                'kitchen_status' => $order->kitchen_status
            ]);
            
            DB::beginTransaction();

            // Check if order has kitchen items by looking at the items directly
            $hasKitchenItems = false;
            $allKitchenItemsReady = true;
            $unreadyItems = [];
            
            // Get all sale items for this order
            $saleItems = SaleItem::with('item.category')
                ->where('sale_id', $order->id)
                ->get();
            
            foreach ($saleItems as $saleItem) {
                // Check if this item belongs to a kitchen category
                if ($saleItem->item && $saleItem->item->category) {
                    $isKitchen = false;
                    if ($saleItem->item->category->is_kitchen_category == 1 || 
                        $saleItem->item->category->is_kitchen_category === true) {
                        $isKitchen = true;
                    }
                    
                    if ($isKitchen) {
                        $hasKitchenItems = true;
                        
                        // Check if this kitchen item is ready
                        $itemStatus = $saleItem->kitchen_status ?? 'pending';
                        if ($itemStatus !== 'ready' && $itemStatus !== 'completed') {
                            $allKitchenItemsReady = false;
                            $unreadyItems[] = $saleItem->item->name . ' (' . $itemStatus . ')';
                        }
                    }
                }
            }

            // If order has kitchen items and they're not all ready, prevent completion
            if ($hasKitchenItems && !$allKitchenItemsReady) {
                $errorMessage = 'Cannot complete order - kitchen items not ready: ' . implode(', ', $unreadyItems);
                Log::warning($errorMessage);
                throw new \Exception($errorMessage);
            }

            // Update order status - only update columns that exist
            $updateData = [
                'status' => 'completed',
                'kitchen_status' => 'completed'
            ];
            
            // Check if completed_at column exists by trying to catch error
            try {
                $updateData['completed_at'] = now();
            } catch (\Exception $e) {
                // Column doesn't exist, skip it
                Log::info('completed_at column does not exist, skipping');
            }
            
            $order->update($updateData);

            // Update all kitchen items to completed
            SaleItem::where('sale_id', $order->id)
                ->whereHas('item.category', function($query) {
                    $query->where('is_kitchen_category', 1);
                })
                ->update([
                    'kitchen_status' => 'completed',
                    'kitchen_completed_at' => now(),
                ]);
            
            Log::info('Kitchen items marked as completed for order', ['order_id' => $order->id]);

            DB::commit();

            // Update cache
            cache()->put('menu_last_updated', time(), 3600);

            Log::info('Order completed successfully', ['order_id' => $order->id]);

            return response()->json([
                'success' => true,
                'message' => 'Order #' . $order->id . ' completed successfully!'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to complete order', [
                'order_id' => $order->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle inventory deduction based on recipe ingredients
     */
    private function deductInventory(Sale $sale)
    {
        $saleItems = SaleItem::with('item.ingredients')->where('sale_id', $sale->id)->get();
        $deductions = [];
        $insufficientStock = [];

        foreach ($saleItems as $saleItem) {
            $item = $saleItem->item;
            
            // Skip if item has no recipe
            if (!$item->ingredients || $item->ingredients->isEmpty()) {
                Log::warning("Item {$item->name} has no recipe defined");
                continue;
            }

            foreach ($item->ingredients as $ingredient) {
                $requiredQuantity = $ingredient->pivot->quantity_required * $saleItem->quantity;
                
                // Check if we have enough
                if ($ingredient->quantity < $requiredQuantity) {
                    $insufficientStock[] = [
                        'ingredient' => $ingredient->name,
                        'required' => $requiredQuantity,
                        'available' => $ingredient->quantity,
                        'unit' => $ingredient->unit,
                        'item' => $item->name
                    ];
                    continue;
                }

                // Track deductions
                if (!isset($deductions[$ingredient->id])) {
                    $deductions[$ingredient->id] = [
                        'ingredient' => $ingredient,
                        'quantity' => 0
                    ];
                }
                $deductions[$ingredient->id]['quantity'] += $requiredQuantity;
            }
        }

        // If any insufficient stock, throw exception
        if (!empty($insufficientStock)) {
            $message = "Insufficient ingredients:\n";
            foreach ($insufficientStock as $issue) {
                $message .= "- {$issue['item']}: Need {$issue['required']} {$issue['unit']} of {$issue['ingredient']} (only {$issue['available']} available)\n";
            }
            throw new \Exception($message);
        }

        // Perform deductions
        foreach ($deductions as $data) {
            $ingredient = $data['ingredient'];
            $newQuantity = $ingredient->quantity - $data['quantity'];
            
            $ingredient->update([
                'quantity' => max(0, $newQuantity) // Prevent negative
            ]);

            Log::info('Inventory deducted', [
                'ingredient' => $ingredient->name,
                'deducted' => $data['quantity'],
                'new_quantity' => $ingredient->quantity,
                'sale_id' => $sale->id
            ]);

            // Check if now low stock
            if ($ingredient->quantity <= $ingredient->min_stock) {
                Log::warning("Low stock alert: {$ingredient->name} has only {$ingredient->quantity} {$ingredient->unit} left");
            }
        }

        return $deductions;
    }
}
