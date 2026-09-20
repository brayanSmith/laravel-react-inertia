<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('detalle_pedidos', function (Blueprint $table) {
            $table->foreignId('bodega_id')->nullable()->after('producto_id')->constrained('bodegas')->nullOnDelete();
        });

        DB::table('detalle_pedidos')->update([
            'bodega_id' => DB::raw('(select bodega_id from pedidos where pedidos.id = detalle_pedidos.pedido_id)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('detalle_pedidos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bodega_id');
        });
    }
};
