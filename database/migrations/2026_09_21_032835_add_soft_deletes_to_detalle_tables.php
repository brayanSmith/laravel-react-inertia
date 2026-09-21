<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Deleting a pedido or a compra keeps its lines (soft deleted) so the
     * record can be restored with its products.
     */
    public function up(): void
    {
        foreach (['detalle_pedidos', 'detalle_compras'] as $tabla) {
            Schema::table($tabla, function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        foreach (['detalle_pedidos', 'detalle_compras'] as $tabla) {
            Schema::table($tabla, function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
