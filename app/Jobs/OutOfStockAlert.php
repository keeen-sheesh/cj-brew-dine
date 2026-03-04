<?php

namespace App\Jobs;

use App\Models\Item;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class OutOfStockAlert implements ShouldQueue
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
            'type' => 'out_of_stock_alert',
            'description' => "Item '{$this->item->name}' is OUT OF STOCK",
            'item_id' => $this->item->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // In a real application, send urgent email/SMS notifications here
        // Example:
        // $users->each(function ($user) {
        //     Mail::send(new OutOfStockAlertMail($this->item, $user));
        //     SMS::send($user->phone, "URGENT: {$this->item->name} is OUT OF STOCK!");
        // });

        // Update item availability
        $this->item->update(['is_available' => false]);
    }

    /**
     * The number of times the job may be attempted.
     */
    public function tries(): int
    {
        return 5;
    }

    /**
     * Calculate the number of milliseconds to wait before retrying the job.
     */
    public function backoff(): array
    {
        return [30, 120, 300, 600, 1800]; // Escalating backoff
    }
}
