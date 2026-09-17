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
        Schema::create('detalle_pedidos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos');
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 12, 2); // snapshot del precio
            $table->decimal('subtotal', 12, 2);
            $table->decimal('costo_unitario', 12, 2)->nullable(); // Para control de inventario
            $table->decimal('costo_total', 12, 2)->nullable(); // Para control de inventario
            $table->decimal('ganancia_total', 12, 2)->nullable(); // Para control de inventario
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detalle_pedidos');
    }
};
