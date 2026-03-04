<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Add room_number column if it doesn't exist
            if (!Schema::hasColumn('sales', 'room_number')) {
                $table->string('room_number', 50)->nullable()->after('customer_address');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('room_number');
        });
    }
};
