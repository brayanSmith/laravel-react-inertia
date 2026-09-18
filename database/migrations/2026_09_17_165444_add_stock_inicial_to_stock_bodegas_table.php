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
        Schema::table('stock_bodegas', function (Blueprint $table) {
            $table->decimal('stock_inicial')->default(0)->after('producto_id');
        });

        $stockIniciales = DB::table('stock_inicials')
            ->select('producto_id', 'bodega_id', DB::raw('SUM(cantidad) as total'))
            ->groupBy('producto_id', 'bodega_id')
            ->get();

        foreach ($stockIniciales as $stockInicial) {
            $stockBodega = DB::table('stock_bodegas')
                ->where('producto_id', $stockInicial->producto_id)
                ->where('bodega_id', $stockInicial->bodega_id)
                ->first();

            if ($stockBodega) {
                DB::table('stock_bodegas')
                    ->where('id', $stockBodega->id)
                    ->update([
                        'stock_inicial' => $stockInicial->total,
                        'stock' => $stockInicial->total + $stockBodega->entradas - $stockBodega->salidas,
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('stock_bodegas')->insert([
                    'producto_id' => $stockInicial->producto_id,
                    'bodega_id' => $stockInicial->bodega_id,
                    'stock_inicial' => $stockInicial->total,
                    'entradas' => 0,
                    'salidas' => 0,
                    'stock' => $stockInicial->total,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_bodegas', function (Blueprint $table) {
            $table->dropColumn('stock_inicial');
        });
    }
};
