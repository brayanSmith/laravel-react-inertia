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
        Schema::create('abonos', function (Blueprint $table) {
            $table->id();
            $table->dateTime('fecha')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->decimal('monto', 12, 2)->default(0);
            // Efectivo/monto completo que el cliente entregó (puede ser mayor a lo
            // que realmente se aplicó al pedido); 'monto' sigue siendo lo aplicado.
            $table->decimal('con_cuanto_pago', 12, 2)->nullable();
            // Vuelto entregado cuando con_cuanto_pago > monto.
            $table->decimal('cambio', 12, 2)->default(0);
            $table->foreignId('puc_id')->constrained('pucs')->onDelete('cascade');
            $table->string('descripcion')->nullable();
            $table->string('imagen')->nullable();
            $table->foreignId('pedido_id')->constrained('pedidos')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('vendedor_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('abonos');
    }
};
