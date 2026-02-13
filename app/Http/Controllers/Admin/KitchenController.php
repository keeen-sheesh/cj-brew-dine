<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class KitchenController extends Controller
{
    public function index(Request $request)
    {
        // Get timestamp of last check (for new order detection)
        $lastCheck = $request->session()->get('last_kitchen_check', now()->subMinutes(5)->timestamp);
        
        // Get all orders with PENDING kitchen status
        $orders = Sale::with(['saleItems.item.category'])
            ->where('kitchen_status', '!=', 'completed')
            ->where('kitchen_status', '!=', 'cancelled')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function($order) {
                return $this->formatOrder($order);
            })
            ->filter(function($order) {
                // Only return orders that have kitchen items
                return count($order['items']) > 0;
            })
            ->values();

        // Check for NEW orders since last check
        $newOrdersCount = Sale::where('kitchen_status', 'pending')
            ->where('created_at', '>', date('Y-m-d H:i:s', $lastCheck))
            ->count();
        
        $hasNewOrder = $newOrdersCount > 0;
        
        // Update last check time
        $request->session()->put('last_kitchen_check', now()->timestamp);

        return Inertia::render('Admin/Kitchen', [
            'orders' => $orders,
            'hasNewOrder' => $hasNewOrder,
            'currentTime' => now()->timestamp,
        ]);
    }

    private function formatOrder($order)
    {
        // Filter only kitchen items (Main Dish)
        $kitchenItems = $order->saleItems->filter(function($saleItem) {
            return $saleItem->item->category->is_kitchen_category ?? false;
        })->map(function($saleItem) {
            return [
                'id' => $saleItem->id,
                'name' => $saleItem->item->name,
                'quantity' => $saleItem->quantity,
                'kitchen_status' => $saleItem->kitchen_status ?? 'pending',
                'started_at' => $saleItem->kitchen_started_at,
                'completed_at' => $saleItem->kitchen_completed_at,
            ];
        });

        $itemsList = $kitchenItems->map(function($item) {
            return $item['quantity'] . 'x ' . $item['name'];
        })->implode(', ');

        return [
            'id' => $order->id,
            'order_number' => 'ORD-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
            'order_type' => $order->order_type,
            'customer_name' => str_replace('Customer: ', '', $order->notes ?? 'Walk-in'),
            'total_amount' => $order->total_amount,
            'created_at' => $order->created_at->format('h:i A'),
            'created_at_raw' => $order->created_at->timestamp,
            'updated_at' => $order->updated_at->format('h:i A'),
            'kitchen_status' => $order->kitchen_status ?? 'pending',
            'items' => $kitchenItems,
            'items_list' => $itemsList,
            'is_urgent' => $order->kitchen_status === 'pending' && 
                         now()->diffInMinutes($order->created_at) > 10,
        ];
    }

    // API endpoint for JavaScript to check for new orders
    public function checkNewOrders(Request $request)
    {
        $since = $request->get('since', now()->subMinutes(5)->timestamp);
        
        $newOrders = Sale::with(['saleItems.item.category'])
            ->where('created_at', '>', date('Y-m-d H:i:s', $since))
            ->where('kitchen_status', 'pending')
            ->get()
            ->map(function($order) {
                return $this->formatOrder($order);
            })
            ->filter(function($order) {
                return count($order['items']) > 0;
            });

        return response()->json([
            'success' => true,
            'timestamp' => now()->timestamp,
            'new_orders' => $newOrders,
            'has_new_orders' => $newOrders->count() > 0,
        ]);
    }

    public function updateStatus(Request $request, Sale $sale)
    {
        $request->validate([
            'status' => 'required|in:pending,preparing,ready,completed',
        ]);

        DB::beginTransaction();
        try {
            $sale->update(['kitchen_status' => $request->status]);

            // Update all kitchen items
            $sale->saleItems()
                ->whereHas('item.category', function($query) {
                    $query->where('is_kitchen_category', true);
                })
                ->update([
                    'kitchen_status' => $request->status,
                    'kitchen_started_at' => $request->status === 'preparing' ? now() : DB::raw('kitchen_started_at'),
                    'kitchen_completed_at' => $request->status === 'ready' ? now() : null,
                ]);

            DB::commit();

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function updateItemStatus(Request $request, SaleItem $saleItem)
    {
        $request->validate([
            'status' => 'required|in:pending,preparing,ready',
        ]);

        try {
            $saleItem->update([
                'kitchen_status' => $request->status,
                'kitchen_started_at' => $request->status === 'preparing' ? now() : null,
                'kitchen_completed_at' => $request->status === 'ready' ? now() : null,
            ]);

            // Update parent order status
            $this->updateOrderKitchenStatus($saleItem->sale_id);

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function updateOrderKitchenStatus($saleId)
    {
        $sale = Sale::with(['saleItems.item.category'])->find($saleId);
        
        $kitchenItems = $sale->saleItems->filter(function($saleItem) {
            return $saleItem->item->category->is_kitchen_category ?? false;
        });

        if ($kitchenItems->isEmpty()) return;

        $allReady = $kitchenItems->every(fn($item) => $item->kitchen_status === 'ready');
        $anyPreparing = $kitchenItems->contains(fn($item) => $item->kitchen_status === 'preparing');

        $status = $allReady ? 'ready' : ($anyPreparing ? 'preparing' : 'pending');
        $sale->update(['kitchen_status' => $status]);
    }

    public function testAlarm()
    {
        return response()->json(['success' => true, 'message' => 'Test alarm triggered']);
    }
}