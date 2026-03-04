<?php
// app/Http/Controllers/Admin/PosController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Item;
use App\Models\PaymentMethod;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Size;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class PosController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::with(['items' => function($query) {
            $query->where('is_available', true)
                  ->orderBy('sort_order', 'asc')
                  ->orderBy('name');
        }, 'items.itemSizes.size'])
        ->where('is_active', true)
        ->orderBy('sort_order', 'asc')
        ->orderBy('name')
        ->get();

        // Format items with their sizes
        foreach ($categories as $category) {
            foreach ($category->items as $item) {
                $item->sizes = $item->itemSizes->map(function($itemSize) {
                    return [
                        'id' => $itemSize->id,
                        'size_id' => $itemSize->size_id,
                        'size_name' => $itemSize->size->name,
                        'display_name' => $itemSize->size->display_name,
                        'price' => (float) $itemSize->price,
                    ];
                });
                $item->has_sizes = $item->sizes->count() > 0;
                $item->pricing_type = $item->pricing_type ?? 'single';
                $item->price_solo = $item->price_solo ? (float)$item->price_solo : null;
                $item->price_whole = $item->price_whole ? (float)$item->price_whole : null;
            }
        }

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
                    $itemName = $saleItem->item->name ?? 'Unknown Item';
                    if ($saleItem->size_id) {
                        $size = Size::find($saleItem->size_id);
                        if ($size) {
                            $itemName .= ' (' . ($size->display_name ?? $size->name) . ')';
                        }
                    }
                    return $itemName;
                })->implode(', ');
                return $order;
            });

        // Get pending/preparing orders (include kitchen status and discounts)
        $pendingOrders = Sale::with(['customer', 'paymentMethod', 'saleItems.item.category', 'saleItems.size'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function($order) {
                // Build items list with proper size display
                $itemsList = $order->saleItems->map(function($saleItem) {
                    $itemName = $saleItem->item->name ?? 'Unknown Item';
                    
                    // IMPORTANT: Check if size exists and add to name
                    if ($saleItem->size) {
                        $sizeName = $saleItem->size->display_name ?? $saleItem->size->name;
                        $itemName .= ' (' . $sizeName . ')';
                    }
                    
                    // Add quantity
                    $itemName = $saleItem->quantity . 'x ' . $itemName;
                    
                    return $itemName;
                })->implode(', ');
                
                // Check if order has kitchen items - FIXED for boolean casting
                $hasKitchenItems = false;
                foreach ($order->saleItems as $saleItem) {
                    if ($saleItem->item && $saleItem->item->category) {
                        $category = $saleItem->item->category;
                        
                        // Check for is_kitchen_category (now cast to boolean in model)
                        if (isset($category->is_kitchen_category) && $category->is_kitchen_category === true) {
                            $hasKitchenItems = true;
                            break;
                        }
                    }
                }
                
                // Check if hotel order
                $isHotel = $order->paymentMethod && $order->paymentMethod->name === 'Hotel';
                
                $order->items_list = $itemsList;
                $order->formatted_total = '₱' . number_format($order->total_amount, 2);
                $order->formatted_subtotal = '₱' . number_format($order->subtotal ?? 0, 2);
                $order->formatted_discount = '₱' . number_format($order->discount_amount ?? 0, 2);
                $order->formatted_service_charge = $order->service_charge > 0 ? '₱' . number_format($order->service_charge, 2) : null;
                $order->formatted_time = $order->created_at->format('h:i A');
                $order->has_kitchen_items = $hasKitchenItems;
                $order->kitchen_status = $order->kitchen_status;
                $order->payment_method_name = $order->paymentMethod ? $order->paymentMethod->name : null;
                $order->room_number = $order->room_number ?? null;
                $order->is_hotel = $isHotel;
                $order->service_charge = $order->service_charge ?? 0;
                
                // Add discount information
                $order->discount_type = $order->discount_type ?? 'none';
                $order->discount_value = $order->discount_value ?? 0;
                $order->cards_presented = $order->cards_presented ?? 0;
                $order->people_count = $order->people_count ?? 1;
                
                // Calculate estimated savings for display
                $savings = [];
                if ($order->cards_presented > 0) {
                    $savings[] = $order->cards_presented . ' Card(s)';
                }
                if ($order->discount_type !== 'none' && $order->discount_value > 0) {
                    $savings[] = $order->discount_type === 'percentage' 
                        ? $order->discount_value . '% off' 
                        : '₱' . $order->discount_value . ' off';
                }
                $order->discount_display = !empty($savings) ? implode(' + ', $savings) : null;
                
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
        }, 'items.itemSizes.size'])
        ->where('is_active', true)
        ->orderBy('sort_order', 'asc')
        ->orderBy('name')
        ->get();

        // Format items with their sizes
        foreach ($categories as $category) {
            foreach ($category->items as $item) {
                $item->sizes = $item->itemSizes->map(function($itemSize) {
                    return [
                        'id' => $itemSize->id,
                        'size_id' => $itemSize->size_id,
                        'size_name' => $itemSize->size->name,
                        'display_name' => $itemSize->size->display_name,
                        'price' => (float) $itemSize->price,
                    ];
                });
                $item->has_sizes = $item->sizes->count() > 0;
                $item->pricing_type = $item->pricing_type ?? 'single';
                $item->price_solo = $item->price_solo ? (float)$item->price_solo : null;
                $item->price_whole = $item->price_whole ? (float)$item->price_whole : null;
            }
        }

        return response()->json([
            'success' => true,
            'updated' => true,
            'categories' => $categories,
            'timestamp' => now()->toDateTimeString(),
            'menu_last_updated' => $currentUpdate,
        ]);
    }

    // 🔥 REAL-TIME: Get order updates (3-second polling) - FIXED for size items and boolean kitchen check
    public function getOrderUpdates(Request $request)
    {
        $orders = Sale::with(['customer', 'paymentMethod', 'saleItems.item.category', 'saleItems.size'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
        
        $pendingOrders = [];
        
        foreach ($orders as $order) {
            // Build items list with proper size display and quantities
            $itemsList = $order->saleItems->map(function($saleItem) {
                $itemName = $saleItem->item->name ?? 'Unknown Item';
                
                // IMPORTANT: Check if size exists and add to name
                if ($saleItem->size) {
                    $sizeName = $saleItem->size->display_name ?? $saleItem->size->name;
                    $itemName .= ' (' . $sizeName . ')';
                }
                
                // Add quantity
                $itemName = $saleItem->quantity . 'x ' . $itemName;
                
                return $itemName;
            })->implode(', ');
            
            // Check if order has kitchen items - FIXED for boolean casting
            $hasKitchenItems = false;
            foreach ($order->saleItems as $saleItem) {
                if ($saleItem->item && $saleItem->item->category) {
                    $category = $saleItem->item->category;
                    
                    // Check for is_kitchen_category (now cast to boolean in model)
                    if (isset($category->is_kitchen_category) && $category->is_kitchen_category === true) {
                        $hasKitchenItems = true;
                        break;
                    }
                }
            }
            
            // Get payment method name
            $paymentMethodName = $order->paymentMethod ? $order->paymentMethod->name : null;
            
            // Check if hotel order
            $isHotel = $paymentMethodName === 'Hotel';
            
            // Calculate discount display
            $savings = [];
            if ($order->cards_presented > 0) {
                $savings[] = $order->cards_presented . ' Card(s)';
            }
            if ($order->discount_type !== 'none' && $order->discount_value > 0) {
                $savings[] = $order->discount_type === 'percentage' 
                    ? $order->discount_value . '% off' 
                    : '₱' . $order->discount_value . ' off';
            }
            $discountDisplay = !empty($savings) ? implode(' + ', $savings) : null;
            
            $pendingOrders[] = [
                'id' => $order->id,
                'total_amount' => (float) $order->total_amount,
                'subtotal' => (float) ($order->subtotal ?? 0),
                'discount_amount' => (float) ($order->discount_amount ?? 0),
                'service_charge' => (float) ($order->service_charge ?? 0),
                'status' => $order->status,
                'kitchen_status' => $order->kitchen_status,
                'has_kitchen_items' => $hasKitchenItems,
                'created_at' => $order->created_at->toISOString(),
                'customer_name' => $order->customer_name,
                'payment_method_name' => $paymentMethodName,
                'room_number' => $order->room_number ?? null,
                'items_list' => $itemsList,
                'formatted_total' => '₱' . number_format($order->total_amount, 2),
                'formatted_subtotal' => '₱' . number_format($order->subtotal ?? 0, 2),
                'formatted_discount' => '₱' . number_format($order->discount_amount ?? 0, 2),
                'formatted_service_charge' => ($order->service_charge ?? 0) > 0 ? '₱' . number_format($order->service_charge, 2) : null,
                'formatted_time' => $order->created_at->format('h:i A'),
                'discount_type' => $order->discount_type ?? 'none',
                'discount_value' => (float) ($order->discount_value ?? 0),
                'cards_presented' => (int) ($order->cards_presented ?? 0),
                'people_count' => (int) ($order->people_count ?? 1),
                'discount_display' => $discountDisplay,
                'is_hotel' => $isHotel,
                'order_number' => 'ORD-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
            ];
        }

        return response()->json([
            'success' => true,
            'pending_orders' => $pendingOrders,
            'timestamp' => now()->toDateTimeString(),
            'count' => count($pendingOrders),
        ]);
    }

    // 🔥 REAL-TIME: Full menu data for manual refresh
    public function getMenuData(Request $request)
    {
        $categories = Category::with(['items' => function($query) {
            $query->where('is_available', true)
                  ->orderBy('sort_order', 'asc')
                  ->orderBy('name');
        }, 'items.itemSizes.size'])
        ->where('is_active', true)
        ->orderBy('sort_order', 'asc')
        ->orderBy('name')
        ->get();

        // Format items with their sizes
        foreach ($categories as $category) {
            foreach ($category->items as $item) {
                $item->sizes = $item->itemSizes->map(function($itemSize) {
                    return [
                        'id' => $itemSize->id,
                        'size_id' => $itemSize->size_id,
                        'size_name' => $itemSize->size->name,
                        'display_name' => $itemSize->size->display_name,
                        'price' => (float) $itemSize->price,
                    ];
                });
                $item->has_sizes = $item->sizes->count() > 0;
                $item->pricing_type = $item->pricing_type ?? 'single';
                $item->price_solo = $item->price_solo ? (float)$item->price_solo : null;
                $item->price_whole = $item->price_whole ? (float)$item->price_whole : null;
            }
        }

        return response()->json([
            'success' => true,
            'categories' => $categories,
            'menu_last_updated' => cache()->get('menu_last_updated', 0),
        ]);
    }

    // 🔥 REAL-TIME: Full order data for manual refresh - FIXED for size items and boolean kitchen check
    public function getOrderData(Request $request)
    {
        $orders = Sale::with(['customer', 'paymentMethod', 'saleItems.item.category', 'saleItems.size'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
        
        $pendingOrders = [];
        
        foreach ($orders as $order) {
            // Build items list with proper size display and quantities
            $itemsList = $order->saleItems->map(function($saleItem) {
                $itemName = $saleItem->item->name ?? 'Unknown Item';
                
                // IMPORTANT: Check if size exists and add to name
                if ($saleItem->size) {
                    $sizeName = $saleItem->size->display_name ?? $saleItem->size->name;
                    $itemName .= ' (' . $sizeName . ')';
                }
                
                // Add quantity
                $itemName = $saleItem->quantity . 'x ' . $itemName;
                
                return $itemName;
            })->implode(', ');
            
            // Check if order has kitchen items - FIXED for boolean casting
            $hasKitchenItems = false;
            foreach ($order->saleItems as $saleItem) {
                if ($saleItem->item && $saleItem->item->category) {
                    $category = $saleItem->item->category;
                    
                    // Check for is_kitchen_category (now cast to boolean in model)
                    if (isset($category->is_kitchen_category) && $category->is_kitchen_category === true) {
                        $hasKitchenItems = true;
                        break;
                    }
                }
            }
            
            // Get payment method name
            $paymentMethodName = $order->paymentMethod ? $order->paymentMethod->name : null;
            
            // Check if hotel order
            $isHotel = $paymentMethodName === 'Hotel';
            
            // Calculate discount display
            $savings = [];
            if ($order->cards_presented > 0) {
                $savings[] = $order->cards_presented . ' Card(s)';
            }
            if ($order->discount_type !== 'none' && $order->discount_value > 0) {
                $savings[] = $order->discount_type === 'percentage' 
                    ? $order->discount_value . '% off' 
                    : '₱' . $order->discount_value . ' off';
            }
            $discountDisplay = !empty($savings) ? implode(' + ', $savings) : null;
            
            $pendingOrders[] = [
                'id' => $order->id,
                'total_amount' => (float) $order->total_amount,
                'subtotal' => (float) ($order->subtotal ?? 0),
                'discount_amount' => (float) ($order->discount_amount ?? 0),
                'service_charge' => (float) ($order->service_charge ?? 0),
                'status' => $order->status,
                'kitchen_status' => $order->kitchen_status,
                'has_kitchen_items' => $hasKitchenItems,
                'created_at' => $order->created_at->toISOString(),
                'customer_name' => $order->customer_name,
                'payment_method_name' => $paymentMethodName,
                'room_number' => $order->room_number ?? null,
                'items_list' => $itemsList,
                'formatted_total' => '₱' . number_format($order->total_amount, 2),
                'formatted_subtotal' => '₱' . number_format($order->subtotal ?? 0, 2),
                'formatted_discount' => '₱' . number_format($order->discount_amount ?? 0, 2),
                'formatted_service_charge' => ($order->service_charge ?? 0) > 0 ? '₱' . number_format($order->service_charge, 2) : null,
                'formatted_time' => $order->created_at->format('h:i A'),
                'discount_type' => $order->discount_type ?? 'none',
                'discount_value' => (float) ($order->discount_value ?? 0),
                'cards_presented' => (int) ($order->cards_presented ?? 0),
                'people_count' => (int) ($order->people_count ?? 1),
                'discount_display' => $discountDisplay,
                'is_hotel' => $isHotel,
                'order_number' => 'ORD-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
            ];
        }

        return response()->json([
            'success' => true,
            'pending_orders' => $pendingOrders,
            'count' => count($pendingOrders),
        ]);
    }

    public function store(Request $request)
    {
        // Log the raw request first
        Log::info('========== RAW REQUEST DATA ==========');
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
                'items.*.size_id' => 'nullable|exists:sizes,id',
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
            $afterDiscountSubtotal = $subtotal - $totalDiscount;

            // Calculate service charge if hotel payment method
            $serviceCharge = 0;
            $paymentMethod = PaymentMethod::find($validated['payment_method_id']);
            if ($paymentMethod && $paymentMethod->name === 'Hotel') {
                $serviceCharge = round($afterDiscountSubtotal * 0.10, 2);
            }

            $totalAmount = $afterDiscountSubtotal + $serviceCharge;

            // Check if order has kitchen items - FIXED for boolean casting
            $hasKitchenItems = false;
            
            foreach ($validated['items'] as $item) {
                $itemModel = Item::with('category')->find($item['id']);
                
                if ($itemModel && $itemModel->category) {
                    // Check for is_kitchen_category (now cast to boolean in model)
                    if (isset($itemModel->category->is_kitchen_category) && $itemModel->category->is_kitchen_category === true) {
                        $hasKitchenItems = true;
                        break;
                    }
                }
            }

            // ============ FIXED: Only set kitchen_status for kitchen items ============
            $initialStatus = 'pending';
            // Only set kitchen_status to pending if there are kitchen items, otherwise null
            $initialKitchenStatus = $hasKitchenItems ? 'pending' : null;
            $paidAt = null;

            Log::info('Order status:', [
                'initial_status' => $initialStatus,
                'initial_kitchen_status' => $initialKitchenStatus,
                'has_kitchen_items' => $hasKitchenItems
            ]);

            $sale = Sale::create([
                'user_id' => auth()->id(),
                'subtotal' => $subtotal,
                'discount_amount' => $totalDiscount,
                'service_charge' => $serviceCharge,
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
                'paid_at' => $paidAt,
            ]);

            foreach ($validated['items'] as $item) {
                $itemModel = Item::with('category')->find($item['id']);
                
                // Check if this specific item is a kitchen item
                $isKitchenItem = false;
                if ($itemModel && $itemModel->category) {
                    if (isset($itemModel->category->is_kitchen_category) && $itemModel->category->is_kitchen_category === true) {
                        $isKitchenItem = true;
                    }
                }
                
                $saleItemData = [
                    'sale_id' => $sale->id,
                    'item_id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'total_price' => $item['price'] * $item['quantity'],
                    'special_instructions' => $item['notes'] ?? null,
                ];
                
                if (isset($item['size_id'])) {
                    $saleItemData['size_id'] = $item['size_id'];
                }
                
                // Only set kitchen_status for kitchen items
                if ($isKitchenItem) {
                    $saleItemData['kitchen_status'] = 'pending';
                }
                
                SaleItem::create($saleItemData);

                if ($itemModel && $itemModel->stock_quantity !== null) {
                    $itemModel->decrement('stock_quantity', $item['quantity']);
                }
            }

            DB::commit();

            // Update menu last updated timestamp
            cache()->put('menu_last_updated', time(), 3600);

            $successMessage = '✅ Order #' . $sale->id . ' placed successfully!';
            if ($hasKitchenItems) {
                $successMessage .= " Kitchen items sent to kitchen.";
            } else {
                $successMessage .= " No kitchen items.";
            }
            if ($serviceCharge > 0) {
                $successMessage .= " Hotel service charge (10%) applied.";
            }

            return redirect()->route('admin.pos.index')->with([
                'success' => $successMessage,
                'order_data' => [
                    'order_id' => $sale->id,
                    'total' => $totalAmount,
                    'discount' => $totalDiscount,
                    'service_charge' => $serviceCharge,
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
            
            if (Schema::hasColumn('sales', 'paid_at')) {
                $updateData['paid_at'] = now();
            }
            
            $sale->update($updateData);

            DB::commit();

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
     * Kitchen marks order as ready for pickup
     * This makes it appear in POS as "ready" for completion
     */
    public function kitchenReady(Request $request, Sale $order)
    {
        try {
            DB::beginTransaction();

            // Update the order status to 'ready' so POS can see it
            $order->update([
                'status' => 'ready',           // This makes it show in POS as ready for pickup
                'kitchen_status' => 'ready',    // This tracks kitchen status
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
                    'kitchen_completed_at' => now(),
                ]);
            }

            DB::commit();

            // Update cache to trigger POS refresh
            cache()->put('menu_last_updated', time(), 3600);

            Log::info('Kitchen marked order as ready for pickup', ['order_id' => $order->id]);

            return response()->json([
                'success' => true,
                'message' => 'Order #' . $order->id . ' is ready for pickup'
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
     * POS completes the order (after pickup)
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
                    
                    // Check for is_kitchen_category (now cast to boolean in model)
                    if (isset($saleItem->item->category->is_kitchen_category) && $saleItem->item->category->is_kitchen_category === true) {
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

            // Update order status to completed
            $updateData = [
                'status' => 'completed',
                'kitchen_status' => 'completed',
                'paid_at' => now(),
            ];
            
            $order->update($updateData);

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
}