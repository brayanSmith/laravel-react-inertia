<?php

namespace App\Http\Controllers;

use App\Models\StockBodega;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StockBodegaController extends Controller
{
    /**
     * Display a listing of stock por bodega.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('stock-bodegas.view');

        return Inertia::render('stock-bodegas/index', [
            'stockBodegas' => StockBodega::with([
                'producto:id,referencia_producto,concatenar_codigo_nombre,costo_producto,valor_detal,valor_mayorista',
                'bodega:id,nombre_bodega',
            ])
                ->orderBy('bodega_id')
                ->orderBy('producto_id')
                ->get(),
        ]);
    }
}
