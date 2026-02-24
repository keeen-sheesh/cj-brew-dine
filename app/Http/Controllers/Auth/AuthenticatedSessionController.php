<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = Auth::user();
        
        // DEBUG: Add logging to see what's happening
        \Log::info('=== LOGIN SUCCESS ===', [
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'isAdmin' => $user->isAdmin(),
            'isResto' => $user->isResto(),
            'isKitchen' => $user->isKitchen(),
        ]);
        
        // SIMPLE REDIRECT - Debug version
        if ($user->role === 'admin') {
            \Log::info('Redirecting to admin dashboard');
            return redirect()->route('admin.dashboard');
        }
        
        if ($user->role === 'resto' || $user->role === 'resto_admin') {
            \Log::info('Redirecting to cashier');
            return redirect('/cashier');
        }
        
        if ($user->role === 'kitchen') {
            \Log::info('Redirecting to kitchen');
            return redirect('/kitchen');
        }
        
        if ($user->role === 'customer') {
            \Log::info('Redirecting to menu');
            return redirect('/menu');
        }
        
        \Log::warning('Unknown role, defaulting to admin dashboard', ['role' => $user->role]);
        return redirect()->route('admin.dashboard');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}