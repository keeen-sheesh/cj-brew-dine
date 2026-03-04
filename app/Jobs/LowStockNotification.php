<?php

namespace App\Jobs;

use App\Models\Item;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class LowStockNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $item;

    /**
     * Create a new job instance.
     */
    public function __construct(Item $item)
    {
        $this->item = $item;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Get all managers and admins
        $users = \App\Models\User::whereIn('role', ['Admin', 'Manager', 'resto_admin'])
            ->get();

        // Create audit log
        DB::table('activity_logs')->insert([
            'type' => 'low_stock_alert',
            'description' => "Item '{$this->item->name}' stock is low: {$this->item->stock_quantity} units (threshold: {$this->item->low_stock_threshold})",
            'item_id' => $this->item->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // In a real application, send email/SMS notifications here
        // Example:
        // $users->each(function ($user) {
        //     Mail::send(new LowStockAlertMail($this->item, $user));
        // });
    }

    /**
     * The number of times the job may be attempted.
     */
    public function tries(): int
    {
        return 3;
    }

    /**
     * Calculate the number of milliseconds to wait before retrying the job.
     */
    public function backoff(): array
    {
        return [60, 300, 600]; // 1 min, 5 min, 10 min
    }
}
