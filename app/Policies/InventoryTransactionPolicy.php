<?php

namespace App\Policies;

use App\Models\InventoryTransaction;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class InventoryTransactionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin', 'kitchen']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, InventoryTransaction $transaction): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin', 'kitchen']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin', 'kitchen']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, InventoryTransaction $transaction): bool
    {
        return $user->hasAnyRole(['admin']);
    }

    /**
     * Determine whether the user can view audit trail.
     */
    public function viewAudit(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'resto_admin']);
    }
}
