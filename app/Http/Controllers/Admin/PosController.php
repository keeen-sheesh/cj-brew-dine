<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Item;
use App\Models\PaymentMethod;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;

class PosController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::with(['items' => function($query) {
            $query->where('is_available', true)
                  ->orderBy('name');
        }])
        ->where('is_active', true)
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

        // Get pending orders (newly placed orders)
        $pendingOrders = Sale::with(['customer', 'saleItems.item'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($order) {
                $order->items_list = $order->saleItems->map(function($saleItem) {
                    return $saleItem->item->name ?? 'Unknown Item';
                })->implode(', ');
                $order->formatted_total = '₱' . number_format($order->total_amount, 2);
                $order->formatted_time = $order->created_at->format('h:i A');
                return $order;
            });

        // Get success/error messages from session
        $success = session('success');
        $error = session('error');
        $orderData = session('order_data');

        return Inertia::render('Admin/POS', [
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
            'readyOrders' => $readyOrders,
            'pendingOrders' => $pendingOrders,
            'appName' => config('app.name', 'CJ Brew & Dine'),
            'flash' => [
                'success' => $success,
                'error' => $error,
                'order_data' => $orderData,
            ],
        ]);
    }

    // 🔥 REAL-TIME: Get menu updates (2-second polling)
    public function getMenuUpdates(Request $request)
    {
        $categories = Category::with(['items' => function($query) {
            $query->orderBy('name');
        }])
        ->where('is_active', true)
        ->orderBy('name')
        ->get();

        return response()->json([
            'success' => true,
            'updated_menu' => $categories,
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    // 🔥 REAL-TIME: Get order updates (2-second polling)
    public function getOrderUpdates(Request $request)
    {
        $pendingOrders = Sale::with(['customer', 'saleItems.item'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($order) {
                $order->items_list = $order->saleItems->map(function($saleItem) {
                    return $saleItem->item->name ?? 'Unknown Item';
                })->implode(', ');
                $order->formatted_total = '₱' . number_format($order->total_amount, 2);
                $order->formatted_time = $order->created_at->format('h:i A');
                return $order;
            });

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
                  ->orderBy('name');
        }])
        ->where('is_active', true)
        ->orderBy('name')
        ->get();

        return response()->json([
            'success' => true,
            'categories' => $categories,
        ]);
    }

    // 🔥 REAL-TIME: Full order data for manual refresh
    public function getOrderData(Request $request)
    {
        $pendingOrders = Sale::with(['customer', 'saleItems.item'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($order) {
                $order->items_list = $order->saleItems->map(function($saleItem) {
                    return $saleItem->item->name ?? 'Unknown Item';
                })->implode(', ');
                $order->formatted_total = '₱' . number_format($order->total_amount, 2);
                $order->formatted_time = $order->created_at->format('h:i A');
                return $order;
            });

        return response()->json([
            'success' => true,
            'pending_orders' => $pendingOrders,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.name' => 'required|string',
            'order_type' => 'required|in:dine_in,takeout,delivery',
            'customer_name' => 'nullable|string|max:255',
            'people_count' => 'required|integer|min:1|max:20',
            'cards_presented' => 'required|integer|min:0|max:20',
            'customer_phone' => 'nullable|string|max:20',
            'customer_address' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
            'discount_type' => 'nullable|in:none,percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $subtotal = collect($validated['items'])->sum(function($item) {
                return $item['price'] * $item['quantity'];
            });

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

            // Check if order has kitchen items
            $hasKitchenItems = false;
            $kitchenItemsList = [];
            
            foreach ($validated['items'] as $item) {
                $itemModel = Item::with('category')->find($item['id']);
                if ($itemModel && $itemModel->category && $itemModel->category->is_kitchen_category) {
                    $hasKitchenItems = true;
                    $kitchenItemsList[] = $itemModel->name;
                }
            }

            $sale = Sale::create([
                'user_id' => auth()->id(),
                'subtotal' => $subtotal,
                'discount_amount' => $totalDiscount,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'kitchen_status' => $hasKitchenItems ? 'pending' : null,
                'order_type' => $validated['order_type'],
                'people_count' => $validated['people_count'],
                'cards_presented' => $validated['cards_presented'],
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'customer_address' => $validated['customer_address'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'discount_type' => $validated['discount_type'] ?? 'none',
                'discount_value' => $validated['discount_value'] ?? 0,
            ]);

            foreach ($validated['items'] as $item) {
                $itemModel = Item::with('category')->find($item['id']);
                $isKitchenItem = $itemModel && $itemModel->category && $itemModel->category->is_kitchen_category;
                
                $saleItemData = [
                    'item_id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'total_price' => $item['price'] * $item['quantity'],
                ];
                
                if ($isKitchenItem) {
                    $saleItemData['kitchen_status'] = 'pending';
                }
                
                $sale->saleItems()->create($saleItemData);
            }

            DB::commit();

            // Show kitchen alert in success message
            $successMessage = '✅ Order #' . $sale->id . ' placed successfully! Total: ₱' . number_format($totalAmount, 2);
            if ($hasKitchenItems) {
                $successMessage .= "\n🍳 Kitchen items: " . implode(', ', $kitchenItemsList);
            }

            return Redirect::route('admin.pos.index')->with([
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
            
            return Redirect::route('admin.pos.index')->with([
                'error' => '❌ Failed to place order: ' . $e->getMessage()
            ]);
        }
    }

    public function markAsPaid(Request $request, Sale $sale)
    {
        try {
            DB::beginTransaction();

            $sale->update([
                'status' => 'completed',
                'paid_at' => now(),
                'payment_method_id' => $request->payment_method_id ?? 1,
            ]);

            DB::commit();

            return Redirect::route('admin.pos.index')->with('success', '✅ Order #' . $sale->id . ' marked as paid successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return Redirect::route('admin.pos.index')->with('error', '❌ Failed to mark as paid: ' . $e->getMessage());
        }
    }

    public function markAsReady(Request $request, Sale $sale)
    {
        try {
            $sale->update([
                'status' => 'ready',
            ]);

            return Redirect::route('admin.pos.index')->with('success', '✅ Order #' . $sale->id . ' marked as ready for payment!');

        } catch (\Exception $e) {
            return Redirect::route('admin.pos.index')->with('error', '❌ Failed to mark as ready: ' . $e->getMessage());
        }
    }

    public function markAsPreparing(Request $request, Sale $sale)
    {
        try {
            $sale->update([
                'status' => 'preparing',
            ]);

            return Redirect::route('admin.pos.index')->with('success', '✅ Order #' . $sale->id . ' marked as preparing!');

        } catch (\Exception $e) {
            return Redirect::route('admin.pos.index')->with('error', '❌ Failed to mark as preparing: ' . $e->getMessage());
        }
    }
}