<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('compras', function (Blueprint $table) {
            $table->id();
            $table->string('factura');
            $table->foreignId('proveedor_id')->constrained('proveedors');
            $table->dateTime('fecha')->nullable();
            $table->enum('estado', ['PENDIENTE', 'RECIBIDA'])->default(value: 'PENDIENTE');
            $table->text('observaciones')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('descuento', 12, 2)->default(0)->nullable();
            $table->decimal('total_a_pagar', 12, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compras');
        // Eliminar registros relacionados en detalle_compras
    }
};
