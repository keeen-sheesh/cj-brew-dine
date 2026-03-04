<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'sort_order',
        'is_active',
        'is_kitchen_category'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_kitchen_category' => 'boolean',
        'sort_order' => 'integer'
    ];

    // Relationship with items
    public function items()
    {
        return $this->hasMany(Item::class)->orderBy('sort_order', 'asc');
    }

    // Scope for active categories
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Default order
    public static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->sort_order)) {
                $category->sort_order = self::max('sort_order') + 1;
            }
        });
    }
}