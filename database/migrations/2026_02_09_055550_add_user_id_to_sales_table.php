<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sales', function (Blueprint $table) {
            // Check and add missing columns
            $columnsToAdd = [
                'user_id' => ['type' => 'foreignId', 'nullable' => true, 'after' => 'customer_id'],
                'people_count' => ['type' => 'integer', 'default' => 1, 'after' => 'table_id'],
                'cards_presented' => ['type' => 'integer', 'default' => 0, 'after' => 'people_count'],
                'payment_method_id' => ['type' => 'foreignId', 'nullable' => true, 'after' => 'cards_presented'],
                'paid_at' => ['type' => 'timestamp', 'nullable' => true, 'after' => 'payment_method_id'],
                'order_type' => ['type' => 'string', 'default' => 'dine_in', 'after' => 'status'],
            ];
            
            foreach ($columnsToAdd as $columnName => $columnConfig) {
                if (!Schema::hasColumn('sales', $columnName)) {
                    if ($columnConfig['type'] === 'foreignId') {
                        $table->foreignId($columnName)->nullable()->after($columnConfig['after']);
                        $table->foreign($columnName)->references('id')->on('users')->onDelete('set null');
                    } elseif ($columnConfig['type'] === 'timestamp') {
                        $table->timestamp($columnName)->nullable()->after($columnConfig['after']);
                    } else {
                        $table->{$columnConfig['type']}($columnName)->default($columnConfig['default'] ?? null)->nullable()->after($columnConfig['after']);
                    }
                }
            }
        });
    }

    public function down()
    {
        Schema::table('sales', function (Blueprint $table) {
            // Drop foreign keys first
            $columnsToDrop = ['user_id', 'payment_method_id'];
            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('sales', $column)) {
                    $table->dropForeign(['user_id']);
                    $table->dropForeign(['payment_method_id']);
                }
            }
            
            // Drop columns
            $table->dropColumn([
                'user_id',
                'people_count', 
                'cards_presented',
                'payment_method_id',
                'paid_at',
                'order_type'
            ]);
        });
    }
};