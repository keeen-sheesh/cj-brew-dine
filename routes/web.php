<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MenuItemController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\FoodController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Menu Items
    Route::get('/menu', [MenuItemController::class, 'index'])->name('menu.index');
    Route::get('/menu/create', [MenuItemController::class, 'create'])->name('menu.create');
    Route::post('/menu', [MenuItemController::class, 'store'])->name('menu.store');
    Route::get('/menu/{menuItem}/edit', [MenuItemController::class, 'edit'])->name('menu.edit');
    Route::put('/menu/{menuItem}', [MenuItemController::class, 'update'])->name('menu.update');
    Route::delete('/menu/{menuItem}', [MenuItemController::class, 'destroy'])->name('menu.destroy');
    
    // Admin Routes
    Route::prefix('admin')->name('admin.')->group(function () {
        // Users
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        
        // Foods (Menu Items with categories)
        Route::get('/foods', [FoodController::class, 'index'])->name('foods.index');
        Route::post('/foods/category', [FoodController::class, 'storeCategory'])->name('foods.category.store');
        Route::put('/foods/category/{category}', [FoodController::class, 'updateCategory'])->name('foods.category.update');
        Route::delete('/foods/category/{category}', [FoodController::class, 'destroyCategory'])->name('foods.category.destroy');
        Route::post('/foods/item', [FoodController::class, 'storeItem'])->name('foods.item.store');
        Route::put('/foods/item/{item}', [FoodController::class, 'updateItem'])->name('foods.item.update');
        Route::delete('/foods/item/{item}', [FoodController::class, 'destroyItem'])->name('foods.item.destroy');
    });
});

require __DIR__.'/auth.php';