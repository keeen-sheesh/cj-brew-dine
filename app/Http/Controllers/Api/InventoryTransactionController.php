<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryTransactionRequest;
use App\Jobs\InventoryTransactionNotification;
use App\Jobs\OutOfStockAlert;
use App\Models\InventoryTransaction;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InventoryTransactionController extends Controller
{
    /**
     * Display a listing of transactions.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', InventoryTransaction::class);

        $query = InventoryTransaction::with(['item', 'user'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc');

        // Filter by item
        if ($request->has('item_id') && !empty($request->item_id)) {
            $query->where('item_id', $request->item_id);
        }

        // Filter by type
        if ($request->has('type') && !empty($request->type)) {
            $query->where('type', $request->type);
        }

        // Filter by date range
        if ($request->has('start_date') && !empty($request->start_date)) {
            $query->whereDate('transaction_date', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $query->whereDate('transaction_date', '<=', $request->end_date);
        }

        // Search in notes
        if ($request->has('search') && !empty($request->search)) {
            $query->where('notes', 'like', '%' . $request->search . '%');
        }

        $transactions = $query->paginate($request->get('per_page', 50));

        return response()->json($transactions);
    }

    /**
     * Store a newly created transaction in storage.
     */
    public function store(InventoryTransactionRequest $request)
    {
        $this->authorize('create', InventoryTransaction::class);

        $data = $request->validated();
        $item = Item::findOrFail($data['item_id']);

        // Calculate quantity before and after
        $quantityBefore = $item->stock_quantity;

        // Determine the sign of the quantity based on type
        $quantity = $data['quantity'];
        if (in_array($data['type'], ['out', 'damage', 'expired'])) {
            $quantity = abs($quantity) * -1;
        } elseif ($data['type'] === 'adjustment') {
            // For adjustment, determine direction
            $quantity = $data['quantity'];
        }

        $quantityAfter = $quantityBefore + $quantity;

        // Create transaction record
        $transaction = InventoryTransaction::create([
            ...$data,
            'quantity' => $quantity,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityAfter,
            'user_id' => auth()->id(),
        ]);

        // Update item stock
        $item->update(['stock_quantity' => $quantityAfter]);

        // Dispatch notification job
        InventoryTransactionNotification::dispatch($transaction);

        // Check if item is now out of stock
        if ($quantityAfter <= 0) {
            OutOfStockAlert::dispatch($item);
        }

        return response()->json($transaction->load(['item', 'user']), Response::HTTP_CREATED);
    }

    /**
     * Display the specified transaction.
     */
    public function show(InventoryTransaction $transaction)
    {
        $this->authorize('view', $transaction);

        return response()->json($transaction->load(['item', 'user']));
    }

    /**
     * Remove the specified transaction from storage.
     */
    public function destroy(InventoryTransaction $transaction)
    {
        $this->authorize('delete', $transaction);

        // Revert the stock change
        $item = $transaction->item;
        $originalQuantity = $transaction->quantity_before;

        $item->update(['stock_quantity' => $originalQuantity]);

        $transaction->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Get transaction summary for date range.
     */
    public function summary(Request $request)
    {
        $this->authorize('viewAudit', auth()->user());

        $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $query = InventoryTransaction::dateRange(
            $request->start_date,
            $request->end_date
        );

        // Group by item
        $summary = $query->with('item')
            ->get()
            ->groupBy('item_id')
            ->map(function ($transactions) {
                return [
                    'item_id' => $transactions->first()->item_id,
                    'item_name' => $transactions->first()->item->name,
                    'total_in' => $transactions->where('type', 'in')->sum('quantity'),
                    'total_out' => abs($transactions->where('type', 'out')->sum('quantity')),
                    'total_damage' => abs($transactions->where('type', 'damage')->sum('quantity')),
                    'total_expired' => abs($transactions->where('type', 'expired')->sum('quantity')),
                    'adjustments' => $transactions->where('type', 'adjustment')->sum('quantity'),
                    'net_change' => $transactions->sum('quantity'),
                    'transaction_count' => $transactions->count(),
                ];
            })
            ->values();

        return response()->json($summary);
    }

    /**
     * Get transactions by item.
     */
    public function byItem(Item $item, Request $request)
    {
        $this->authorize('view', $item);

        $query = $item->inventoryTransactions()
            ->with('user')
            ->orderBy('transaction_date', 'desc');

        // Apply date range filter if provided
        if ($request->has('start_date') && !empty($request->start_date)) {
            $query->whereDate('transaction_date', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $query->whereDate('transaction_date', '<=', $request->end_date);
        }

        $transactions = $query->paginate($request->get('per_page', 50));

        return response()->json($transactions);
    }

    /**
     * Get recent transactions (last N days).
     */
    public function recent(Request $request)
    {
        $this->authorize('viewAudit', auth()->user());

        $days = $request->get('days', 7);

        $transactions = InventoryTransaction::where('transaction_date', '>=', now()->subDays($days))
            ->with(['item', 'user'])
            ->orderBy('transaction_date', 'desc')
            ->paginate($request->get('per_page', 50));

        return response()->json($transactions);
    }
}
