<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            // Add size_id column if it doesn't exist
            if (!Schema::hasColumn('sale_items', 'size_id')) {
                $table->foreignId('size_id')
                      ->nullable()
                      ->after('item_id')
                      ->constrained('sizes')
                      ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            if (Schema::hasColumn('sale_items', 'size_id')) {
                $table->dropForeign(['size_id']);
                $table->dropColumn('size_id');
            }
        });
    }
};