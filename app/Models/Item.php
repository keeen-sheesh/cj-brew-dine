<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'category_id',
        'is_available',
        'stock_quantity',
        'low_stock_threshold',
        'pricing_type', // Add this field
        'price_solo',   // Add this field
        'price_whole',  // Add this field
        'sort_order'
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'price' => 'decimal:2',
        'price_solo' => 'decimal:2',
        'price_whole' => 'decimal:2',
        'stock_quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'sort_order' => 'integer'
    ];

    // Relationship with category
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Relationship with sale items
    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    // Scope for available items
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    // Get display price based on pricing type
    public function getDisplayPriceAttribute()
    {
        if ($this->pricing_type === 'dual') {
            return [
                'solo' => $this->price_solo,
                'whole' => $this->price_whole
            ];
        }
        return ['single' => $this->price];
    }

    // Default order
    public static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            if (empty($item->sort_order)) {
                $item->sort_order = self::where('category_id', $item->category_id)->max('sort_order') + 1;
            }
        });
    }
}