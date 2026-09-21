<?php

namespace App\Http\Controllers;

use App\Models\Bodega;
use App\Models\Producto;
use App\Models\StockBodega;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StockBodegaController extends Controller
{
    /**
     * Display a listing of stock por bodega.
     *
     * The payload is kept small on purpose (the table has thousands of
     * product/bodega pairs): products and bodegas are sent once and rows
     * reference them by id, and pairs with nothing in them are left out —
     * the table treats a missing pair as zero.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('stock-bodegas.view');

        // Stock rows whose product no longer exists are orphans: not listed.
        $productosVigentes = Producto::select('id');

        $conStock = StockBodega::query()
            ->whereIn('producto_id', $productosVigentes)
            ->where(fn ($query) => $query
                ->where('stock_inicial', '<>', 0)
                ->orWhere('entradas', '<>', 0)
                ->orWhere('salidas', '<>', 0)
                ->orWhere('stock', '<>', 0))
            ->orderBy('bodega_id')
            ->orderBy('producto_id')
            ->get(['id', 'producto_id', 'bodega_id', 'stock_inicial', 'entradas', 'salidas', 'stock']);

        $productoIds = StockBodega::query()->whereIn('producto_id', $productosVigentes)->distinct()->pluck('producto_id');
        $bodegaIds = StockBodega::query()->whereIn('producto_id', $productosVigentes)->distinct()->pluck('bodega_id');

        return Inertia::render('stock-bodegas/index', [
            'stockBodegas' => $conStock,
            'productos' => Producto::whereIn('id', $productoIds)
                ->get(['id', 'referencia_producto', 'concatenar_codigo_nombre', 'costo_producto', 'valor_detal', 'valor_mayorista']),
            'bodegas' => Bodega::whereIn('id', $bodegaIds)->get(['id', 'nombre_bodega']),
        ]);
    }
}
