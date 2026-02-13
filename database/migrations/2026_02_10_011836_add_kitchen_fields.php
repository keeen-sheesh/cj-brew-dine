<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->string('kitchen_status')->default('pending')->nullable();
            $table->timestamp('kitchen_started_at')->nullable();
            $table->timestamp('kitchen_completed_at')->nullable();
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('is_kitchen_category')->default(false);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('kitchen_status')->nullable();
        });
    }

    public function down()
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['kitchen_status', 'kitchen_started_at', 'kitchen_completed_at']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('is_kitchen_category');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('kitchen_status');
        });
    }
};