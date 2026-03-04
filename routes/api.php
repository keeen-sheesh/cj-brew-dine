<?php

use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\InventoryTransactionController;
use App\Http\Controllers\Api\ItemController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/**
 * API Routes for Inventory Management System
 * All routes require authentication and specific roles
 */

Route::middleware(['auth:sanctum'])->group(function () {

    /**
     * ==================== ITEMS MANAGEMENT ====================
     */
    Route::prefix('items')->name('items.')->group(function () {
        Route::get('/', [ItemController::class, 'index'])->name('index');
        Route::post('/', [ItemController::class, 'store'])->name('store');
        Route::get('/{item}', [ItemController::class, 'show'])->name('show');
        Route::put('/{item}', [ItemController::class, 'update'])->name('update');
        Route::delete('/{item}', [ItemController::class, 'destroy'])->name('destroy');
        
        // Special item endpoints
        Route::get('/low-stock/list', [ItemController::class, 'lowStock'])->name('low-stock');
        Route::patch('/{item}/stock', [ItemController::class, 'updateStock'])->name('update-stock');
        
        // Category-based retrieval
        Route::get('/category/{category}/items', [ItemController::class, 'byCategory'])->name('by-category');
    });

    /**
     * ==================== CATEGORIES MANAGEMENT ====================
     */
    Route::prefix('categories')->name('categories.')->group(function () {
        Route::get('/', [CategoryController::class, 'index'])->name('index');
        Route::post('/', [CategoryController::class, 'store'])->name('store');
        Route::get('/{category}', [CategoryController::class, 'show'])->name('show');
        Route::put('/{category}', [CategoryController::class, 'update'])->name('update');
        Route::delete('/{category}', [CategoryController::class, 'destroy'])->name('destroy');
        
        // Special category endpoints
        Route::get('/active/all', [CategoryController::class, 'active'])->name('active');
        Route::get('/kitchen/list', [CategoryController::class, 'kitchen'])->name('kitchen');
    });

    /**
     * ==================== INGREDIENTS MANAGEMENT ====================
     */
    Route::prefix('ingredients')->name('ingredients.')->group(function () {
        Route::get('/', [IngredientController::class, 'index'])->name('index');
        Route::post('/', [IngredientController::class, 'store'])->name('store');
        Route::get('/{ingredient}', [IngredientController::class, 'show'])->name('show');
        Route::put('/{ingredient}', [IngredientController::class, 'update'])->name('update');
        Route::delete('/{ingredient}', [IngredientController::class, 'destroy'])->name('destroy');
        
        // Special ingredient endpoints
        Route::get('/low-stock/list', [IngredientController::class, 'lowStock'])->name('low-stock');
        Route::patch('/{ingredient}/stock', [IngredientController::class, 'updateStock'])->name('update-stock');
        Route::get('/units/list', [IngredientController::class, 'units'])->name('units');
    });

    /**
     * ==================== INVENTORY TRANSACTIONS ====================
     */
    Route::prefix('transactions')->name('transactions.')->group(function () {
        Route::get('/', [InventoryTransactionController::class, 'index'])->name('index');
        Route::post('/', [InventoryTransactionController::class, 'store'])->name('store');
        Route::get('/{transaction}', [InventoryTransactionController::class, 'show'])->name('show');
        Route::delete('/{transaction}', [InventoryTransactionController::class, 'destroy'])->name('destroy');
        
        // Analytics endpoints
        Route::get('/summary/generate', [InventoryTransactionController::class, 'summary'])->name('summary');
        Route::get('/recent/list', [InventoryTransactionController::class, 'recent'])->name('recent');
        
        // Item-specific transactions
        Route::get('/item/{item}/history', [InventoryTransactionController::class, 'byItem'])->name('by-item');
    });

    /**
     * ==================== USER ENDPOINT ====================
     */
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
