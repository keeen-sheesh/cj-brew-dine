<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Add column to sales table
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'kitchen_status')) {
                $table->string('kitchen_status')->nullable()->after('status');
            }
        });

        // Add columns to sale_items table
        Schema::table('sale_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_items', 'kitchen_status')) {
                $table->string('kitchen_status')->nullable()->after('total_price');
            }
            if (!Schema::hasColumn('sale_items', 'kitchen_started_at')) {
                $table->timestamp('kitchen_started_at')->nullable();
            }
            if (!Schema::hasColumn('sale_items', 'kitchen_completed_at')) {
                $table->timestamp('kitchen_completed_at')->nullable();
            }
        });
    }

    public function down()
    {
        // Remove columns from sale_items table
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['kitchen_status', 'kitchen_started_at', 'kitchen_completed_at']);
        });

        // Remove column from sales table
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('kitchen_status');
        });
    }
};