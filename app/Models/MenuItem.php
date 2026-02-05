<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'restobar_id', 'name', 'description', 'price', 
        'category', 'stock', 'is_available', 'image_url'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean'
    ];

    // Relationship: Menu item belongs to a restobar
    public function restobar()
    {
        return $this->belongsTo(Restobar::class);
    }
}