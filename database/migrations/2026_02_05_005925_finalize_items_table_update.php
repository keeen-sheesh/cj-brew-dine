<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add foreign key constraint if not exists
        Schema::table('items', function (Blueprint $table) {
            // Check if foreign key already exists
            $foreignKeys = DB::select('PRAGMA foreign_key_list(items)');
            $hasForeignKey = false;
            
            foreach ($foreignKeys as $fk) {
                if ($fk->table === 'categories' && $fk->from === 'category_id') {
                    $hasForeignKey = true;
                    break;
                }
            }
            
            if (!$hasForeignKey) {
                $table->foreign('category_id')
                    ->references('id')
                    ->on('categories')
                    ->onDelete('set null');
            }
        });
        
        // 2. Drop old category column if it exists
        if (Schema::hasColumn('items', 'category')) {
            Schema::table('items', function (Blueprint $table) {
                $table->dropColumn('category');
            });
        }
    }
    
    public function down(): void
    {
        // 1. Remove foreign key
        Schema::table('items', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });
        
        // 2. Add back category column
        if (!Schema::hasColumn('items', 'category')) {
            Schema::table('items', function (Blueprint $table) {
                $table->string('category')->nullable()->after('description');
            });
            
            // Restore category names
            $items = DB::table('items')
                ->join('categories', 'items.category_id', '=', 'categories.id')
                ->select('items.id', 'categories.name as category_name')
                ->get();
            
            foreach ($items as $item) {
                DB::table('items')
                    ->where('id', $item->id)
                    ->update(['category' => $item->category_name]);
            }
        }
    }
};