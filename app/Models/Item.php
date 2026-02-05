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
        'category_id', // Changed from 'category'
        'image_url',
        'ingredients',
        'preparation_time',
        'stock_quantity',
        'low_stock_threshold',
        'is_available',
        'is_featured',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
        'is_featured' => 'boolean',
        'preparation_time' => 'integer', // in minutes
        'stock_quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'sort_order' => 'integer',
    ];

    // Relationship with category
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'item_ingredients')
                    ->withPivot('quantity_required')
                    ->withTimestamps();
    }

    // Scope for available items
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    // Scope for featured items
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    // Scope for low stock items
    public function scopeLowStock($query)
    {
        return $query->whereRaw('stock_quantity <= low_stock_threshold');
    }

    // Check if item is low in stock
    public function isLowStock()
    {
        return $this->stock_quantity <= $this->low_stock_threshold;
    }

    // Format price for display
    public function getFormattedPriceAttribute()
    {
        return '₱' . number_format($this->price, 2);
    }

    // Get preparation time in readable format
    public function getPreparationTimeFormattedAttribute()
    {
        if ($this->preparation_time < 60) {
            return $this->preparation_time . ' mins';
        }
        
        $hours = floor($this->preparation_time / 60);
        $minutes = $this->preparation_time % 60;
        
        if ($minutes > 0) {
            return $hours . 'h ' . $minutes . 'm';
        }
        
        return $hours . ' hour' . ($hours > 1 ? 's' : '');
    }
}