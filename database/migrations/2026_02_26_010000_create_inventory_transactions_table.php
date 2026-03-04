<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('inventory_transactions')) {
            Schema::create('inventory_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('item_id')->constrained()->restrictOnDelete();
                $table->enum('type', ['in', 'out', 'adjustment', 'damage', 'expired']);
                $table->integer('quantity');
                $table->integer('quantity_before')->nullable();
                $table->integer('quantity_after')->nullable();
                $table->enum('reference_type', ['sale', 'purchase', 'manual', 'waste'])->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->timestamp('transaction_date')->useCurrent();
                $table->timestamps();

                $table->index(['item_id', 'transaction_date']);
                $table->index(['type']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};

