<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'type', // 'in', 'out', 'adjustment', 'damage', 'expired'
        'quantity',
        'quantity_before',
        'quantity_after',
        'reference_type', // 'sale', 'purchase', 'manual', 'waste'
        'reference_id',
        'notes',
        'user_id',
        'transaction_date',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'quantity_before' => 'integer',
        'quantity_after' => 'integer',
        'transaction_date' => 'datetime',
    ];

    /**
     * Get the item associated with this transaction
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Get the user who created this transaction
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: Get recent transactions
     */
    public function scopeRecent($query)
    {
        return $query->orderBy('transaction_date', 'desc')
                     ->orderBy('created_at', 'desc');
    }

    /**
     * Scope: Get inbound transactions (stock increase)
     */
    public function scopeInbound($query)
    {
        return $query->whereIn('type', ['in', 'adjustment'])
                     ->where('quantity', '>', 0);
    }

    /**
     * Scope: Get outbound transactions (stock decrease)
     */
    public function scopeOutbound($query)
    {
        return $query->whereIn('type', ['out', 'damage', 'expired'])
                     ->orWhere(function ($query) {
                         $query->where('type', 'adjustment')
                               ->where('quantity', '<', 0);
                     });
    }

    /**
     * Scope: Get transactions for a specific date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }
}
