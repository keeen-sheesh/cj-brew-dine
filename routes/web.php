<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FoodCategoryController;
use App\Http\Controllers\Admin\FoodItemController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public routes - WITH DEBUG LOGGING
Route::get('/', function () {
    // DEBUG: Log access
    \Log::info('=== HOME PAGE ACCESSED ===', [
        'is_authenticated' => Auth::check(),
        'user_role' => Auth::check() ? Auth::user()->role : 'guest',
        'session_id' => session()->getId(),
        'url' => request()->fullUrl(),
    ]);

    // Check if user is already authenticated
    if (Auth::check()) {
        $user = Auth::user();

        \Log::info('User is logged in, redirecting based on role', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role' => $user->role,
        ]);

        // FORCE ADMIN TO ADMIN DASHBOARD
        if ($user->role === 'admin') {
            \Log::info('FORCE REDIRECT: Admin user to /admin/dashboard');
            return redirect('/admin/dashboard');
        }

        // Redirect based on user role
        $roleRedirects = [
            'admin' => '/admin/dashboard',
            'resto_admin' => '/cashier',
            'resto' => '/cashier',
            'kitchen' => '/kitchen',
            'customer' => '/menu',
        ];

        $redirectTo = $roleRedirects[$user->role] ?? '/admin/dashboard';

        \Log::info('Redirecting user to: ' . $redirectTo);

        return redirect($redirectTo);
    }

    \Log::info('Showing welcome page to guest');

    // Only show welcome page to guests (not logged in users)
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

// Auth routes (handled by Breeze)
require __DIR__.'/auth.php';

// Admin routes
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ==================== FOODS MANAGEMENT ====================
    // Main foods page (tabs interface like PHP version)
    Route::get('/foods', [FoodCategoryController::class, 'index'])->name('foods.index');
    
    // Food Categories API Routes
    Route::get('/food-categories', [FoodCategoryController::class, 'index'])->name('food-categories.index'); // Keep for compatibility
    Route::post('/food-categories', [FoodCategoryController::class, 'store'])->name('food-categories.store');
    Route::put('/food-categories/{category}', [FoodCategoryController::class, 'update'])->name('food-categories.update');
    Route::delete('/food-categories/{category}', [FoodCategoryController::class, 'destroy'])->name('food-categories.destroy');
    Route::post('/food-categories/{category}/toggle-status', [FoodCategoryController::class, 'toggleStatus'])->name('food-categories.toggle-status');
    Route::post('/food-categories/update-order', [FoodCategoryController::class, 'updateOrder'])->name('food-categories.update-order');

    // Food Items API Routes
    Route::get('/food-items', [FoodItemController::class, 'index'])->name('food-items.index'); // Keep for compatibility
    Route::post('/food-items', [FoodItemController::class, 'store'])->name('food-items.store');
    Route::put('/food-items/{item}', [FoodItemController::class, 'update'])->name('food-items.update');
    Route::delete('/food-items/{item}', [FoodItemController::class, 'destroy'])->name('food-items.destroy');
    Route::post('/food-items/{item}/toggle-status', [FoodItemController::class, 'toggleStatus'])->name('food-items.toggle-status');
    Route::post('/food-items/{item}/toggle-featured', [FoodItemController::class, 'toggleFeatured'])->name('food-items.toggle-featured');
    Route::post('/food-items/update-order', [FoodItemController::class, 'updateOrder'])->name('food-items.update-order');
    Route::put('/food-items/{item}/update-stock', [FoodItemController::class, 'updateStock'])->name('food-items.update-stock');

    // Other admin routes
    Route::get('/reports', function () {
        return Inertia::render('Admin/Reports/Index');
    })->name('reports.index');

    Route::get('/roles', function () {
        return Inertia::render('Admin/Roles/Index');
    })->name('roles.index');

    Route::get('/inventory', function () {
        return Inertia::render('Admin/Inventory/Index');
    })->name('inventory.index');

    Route::get('/settings', function () {
        return Inertia::render('Admin/Settings/Index');
    })->name('settings.index');
});

// Cashier routes
Route::middleware(['auth', 'verified', 'role:resto,admin'])->prefix('cashier')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Cashier/Dashboard');
    });
});

// Kitchen routes
Route::middleware(['auth', 'verified', 'role:kitchen,admin'])->prefix('kitchen')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Kitchen/Dashboard');
    });
});

// Customer routes
Route::middleware(['auth', 'verified', 'role:customer'])->group(function () {
    Route::get('/menu', function () {
        return Inertia::render('Customer/Menu');
    });
});

// Add a GET logout route for convenience (optional)
Route::get('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect('/');
});