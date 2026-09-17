<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stock_bodegas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bodega_id')->constrained('bodegas');
            $table->foreignId('producto_id')->constrained('productos');
            $table->decimal('entradas')->default(0);
            $table->decimal('salidas')->default(0);
            $table->decimal('stock')->default(0);
            $table->timestamps();

            $table->unique(['producto_id', 'bodega_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_bodegas');
    }
};
