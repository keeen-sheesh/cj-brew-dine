<?php

namespace App\Http\Middleware;

use App\Providers\RouteServiceProvider;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user = Auth::user();
                
                // Redirect based on user role
                if ($user->isAdmin() || $user->isRestoAdmin()) {
                    return redirect()->route('admin.dashboard');
                } elseif ($user->isKitchen()) {
                    return redirect('/admin/kitchen');
                } elseif ($user->isResto() || $user->hasRole('cashier')) {
                    return redirect('/cashier/dashboard');
                } elseif ($user->isCustomer()) {
                    return redirect('/menu');
                }
                
                return redirect(RouteServiceProvider::HOME);
            }
        }

        return $next($request);
    }
}
