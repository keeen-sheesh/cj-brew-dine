<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restobar extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'code', 'address', 'contact_phone', 'is_active'
    ];

    // Relationship: A restobar has many menu items
    public function menuItems()
    {
        return $this->hasMany(MenuItem::class);
    }

    // Relationship: A restobar has many users (staff)
    public function users()
    {
        return $this->hasMany(User::class);
    }
}