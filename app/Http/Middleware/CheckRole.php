<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect()->route('login');
        }
        
        // DEBUG: log roles passed to middleware
        \Log::info('CheckRole middleware', [
            'requested_uri' => $request->path(),
            'user_role' => $user->role,
            'roles_param' => $roles,
        ]);
        
        // Check if user has any of the required roles
        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }
        
        // If no role matches, redirect based on user role
        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        } elseif ($user->isKitchen()) {
            return redirect('/kitchen');
        } elseif ($user->isResto() || $user->isRestoAdmin()) {
            return redirect('/cashier');
        } else {
            return redirect('/menu');
        }
    }
}