<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FoodCategoryController;
use App\Http\Controllers\Admin\FoodItemController;
use App\Http\Controllers\Admin\ReportsController;
use App\Http\Controllers\Admin\PosController;
use App\Http\Controllers\Admin\KitchenController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public routes
Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();
        $roleRedirects = [
            'admin' => '/admin/dashboard',
            'resto_admin' => '/cashier/pos',
            'resto' => '/cashier/pos',
            'kitchen' => '/admin/kitchen',
            'customer' => '/menu',
        ];
        return redirect($roleRedirects[$user->role] ?? '/admin/dashboard');
    }
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

// Auth routes (handled by Breeze)
require __DIR__.'/auth.php';

// Admin routes
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    // ==================== DASHBOARD ROUTES ====================
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/transactions', [DashboardController::class, 'transactions'])->name('transactions');
    Route::get('/transactions/{id}', [DashboardController::class, 'getTransaction'])->name('transactions.show');

    // ==================== POS SYSTEM ====================
    Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
    Route::post('/pos/orders', [PosController::class, 'store'])->name('pos.orders.store');
    Route::post('/orders/{order}/pay', [PosController::class, 'markAsPaid'])->name('orders.pay');
    Route::post('/orders/{order}/ready', [PosController::class, 'markAsReady'])->name('orders.ready');
    Route::post('/orders/{order}/preparing', [PosController::class, 'markAsPreparing'])->name('orders.preparing');
    Route::post('/orders/{order}/complete', [PosController::class, 'complete'])->name('orders.complete');
    
    // POS Real-time routes
    Route::get('/pos/menu-updates', [PosController::class, 'getMenuUpdates'])->name('pos.menu-updates');
    Route::get('/pos/order-updates', [PosController::class, 'getOrderUpdates'])->name('pos.order-updates');
    Route::get('/pos/menu-data', [PosController::class, 'getMenuData'])->name('pos.menu-data');
    Route::get('/pos/order-data', [PosController::class, 'getOrderData'])->name('pos.order-data');
    
    // ==================== KITCHEN ROUTES ====================
    Route::prefix('kitchen')->name('kitchen.')->group(function () {
        // Main kitchen display
        Route::get('/', [KitchenController::class, 'index'])->name('index');
        
        // Polling and real-time
        Route::get('/poll', [KitchenController::class, 'poll'])->name('poll');
        Route::get('/check-new', [KitchenController::class, 'checkNewOrders'])->name('check-new');
        Route::get('/test-alarm', [KitchenController::class, 'testAlarm'])->name('test-alarm');
        
        // Order status updates
        Route::put('/order/{sale}/status', [KitchenController::class, 'updateStatus'])->name('update-status');
        Route::put('/item/{saleItem}/status', [KitchenController::class, 'updateItemStatus'])->name('update-item-status');
        
        // Kitchen actions
        Route::post('/orders/{order}/start', [KitchenController::class, 'startPreparing'])->name('start');
        Route::post('/orders/{order}/ready', [KitchenController::class, 'markReady'])->name('ready');
        Route::post('/orders/{order}/complete', [KitchenController::class, 'markComplete'])->name('complete');
    });
    
    // ==================== FOODS MANAGEMENT ====================
    // Page route (renders the React page)
    Route::get('/foods', [FoodCategoryController::class, 'index'])->name('foods.index');
    
    // Food Categories API Routes (JSON)
    Route::get('/food-categories', [FoodCategoryController::class, 'apiIndex'])->name('food-categories.index');
    Route::post('/food-categories', [FoodCategoryController::class, 'store'])->name('food-categories.store');
    Route::put('/food-categories/{category}', [FoodCategoryController::class, 'update'])->name('food-categories.update');
    Route::delete('/food-categories/{category}', [FoodCategoryController::class, 'destroy'])->name('food-categories.destroy');
    Route::post('/food-categories/{category}/toggle-status', [FoodCategoryController::class, 'toggleStatus'])->name('food-categories.toggle-status');
    Route::post('/food-categories/update-order', [FoodCategoryController::class, 'updateOrder'])->name('food-categories.update-order');

    // Food Items API Routes
    Route::get('/food-items', [FoodItemController::class, 'index'])->name('food-items.index');
    Route::post('/food-items', [FoodItemController::class, 'store'])->name('food-items.store');
    Route::put('/food-items/{item}', [FoodItemController::class, 'update'])->name('food-items.update');
    Route::delete('/food-items/{item}', [FoodItemController::class, 'destroy'])->name('food-items.destroy');
    Route::post('/food-items/{item}/toggle-status', [FoodItemController::class, 'toggleStatus'])->name('food-items.toggle-status');
    Route::post('/food-items/{item}/toggle-featured', [FoodItemController::class, 'toggleFeatured'])->name('food-items.toggle-featured');
    Route::post('/food-items/update-order', [FoodItemController::class, 'updateOrder'])->name('food-items.update-order');
    Route::put('/food-items/{item}/update-stock', [FoodItemController::class, 'updateStock'])->name('food-items.update-stock');

    // ==================== ITEM SIZES ROUTES ====================
    Route::get('/items/{item}/sizes', function($itemId) {
        $item = App\Models\Item::with('itemSizes.size')->find($itemId);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Item not found']);
        }
        
        $sizes = $item->itemSizes->map(function($itemSize) {
            return [
                'id' => $itemSize->id,
                'size_id' => $itemSize->size_id,
                'size_name' => $itemSize->size->name,
                'display_name' => $itemSize->size->display_name,
                'price' => (float) $itemSize->price,
            ];
        });
        
        return response()->json(['success' => true, 'sizes' => $sizes]);
    })->name('items.sizes');

    // Other admin routes
    Route::get('/reports', [ReportsController::class, 'index'])->name('reports.index');
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
        return redirect('/cashier/pos');
    })->name('cashier.dashboard');
    
    Route::get('/pos', [PosController::class, 'index'])->name('cashier.pos');
    Route::post('/pos/orders', [PosController::class, 'store'])->name('cashier.pos.orders.store');
    Route::post('/orders/{order}/pay', [PosController::class, 'markAsPaid'])->name('cashier.orders.pay');
    Route::post('/orders/{order}/ready', [PosController::class, 'markAsReady'])->name('cashier.orders.ready');
    Route::post('/orders/{order}/preparing', [PosController::class, 'markAsPreparing'])->name('cashier.orders.preparing');
    Route::post('/orders/{order}/complete', [PosController::class, 'complete'])->name('cashier.orders.complete');
    
    Route::get('/pos/menu-updates', [PosController::class, 'getMenuUpdates'])->name('cashier.pos.menu-updates');
    Route::get('/pos/order-updates', [PosController::class, 'getOrderUpdates'])->name('cashier.pos.order-updates');
    Route::get('/pos/menu-data', [PosController::class, 'getMenuData'])->name('cashier.pos.menu-data');
    Route::get('/pos/order-data', [PosController::class, 'getOrderData'])->name('cashier.pos.order-data');
});

// Kitchen role redirects to admin/kitchen
Route::middleware(['auth', 'verified', 'role:kitchen,admin'])->prefix('kitchen')->group(function () {
    Route::get('/', function () {
        return redirect('/admin/kitchen');
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