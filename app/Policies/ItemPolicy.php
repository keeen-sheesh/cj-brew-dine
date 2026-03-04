<?php

namespace App\Policies;

use App\Models\Item;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ItemPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin', 'kitchen', 'resto']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Item $item): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin', 'kitchen', 'resto']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin', 'kitchen']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Item $item): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin', 'kitchen']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Item $item): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Item $item): bool
    {
        return $user->hasAnyRole(['admin']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Item $item): bool
    {
        return $user->hasAnyRole(['admin']);
    }

    /**
     * Determine whether the user can view inventory details.
     */
    public function viewInventory(User $user, Item $item): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin', 'kitchen']);
    }

    /**
     * Determine whether the user can update stock.
     */
    public function updateStock(User $user, Item $item): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin', 'kitchen']);
    }
}
