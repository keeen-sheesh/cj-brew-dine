<?php

namespace App\Jobs;

use App\Models\InventoryTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class InventoryTransactionNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $transaction;

    /**
     * Create a new job instance.
     */
    public function __construct(InventoryTransaction $transaction)
    {
        $this->transaction = $transaction;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $transaction = $this->transaction->load(['item', 'user']);

        // Create audit log
        DB::table('activity_logs')->insert([
            'type' => 'inventory_transaction',
            'description' => "{$transaction->user->name} recorded a {$transaction->type} transaction for {$transaction->item->name}: {$transaction->quantity} units",
            'item_id' => $transaction->item_id,
            'transaction_id' => $transaction->id,
            'user_id' => $transaction->user_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Check if stock is now low after transaction
        if ($transaction->item->stock_quantity <= $transaction->item->low_stock_threshold) {
            // Dispatch low stock notification
            LowStockNotification::dispatch($transaction->item);
        }
    }

    /**
     * The number of times the job may be attempted.
     */
    public function tries(): int
    {
        return 3;
    }
}
