<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockIniciales\StoreStockInicialRequest;
use App\Http\Requests\StockIniciales\UpdateStockInicialRequest;
use App\Models\Bodega;
use App\Models\Producto;
use App\Models\StockBodega;
use App\Models\StockInicial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StockInicialController extends Controller
{
    /**
     * Display a listing of stock iniciales.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('stock-iniciales.view');

        return Inertia::render('stock-iniciales/index', [
            'stockIniciales' => StockInicial::with(['producto', 'bodega'])->latest()->get(),
            'productos' => Producto::where('categoria', '!=', 'SERVICIO')
                ->where('inventariable', true)
                ->orderBy('referencia_producto')
                ->get(['id', 'referencia_producto', 'concatenar_codigo_nombre', 'costo_producto']),
            'bodegas' => Bodega::orderBy('nombre_bodega')->get(['id', 'nombre_bodega']),
            'permissions' => [
                'canCreate' => $request->user()->can('stock-iniciales.create'),
                'canUpdate' => $request->user()->can('stock-iniciales.update'),
                'canDelete' => $request->user()->can('stock-iniciales.delete'),
            ],
        ]);
    }

    /**
     * Store a newly created stock inicial.
     */
    public function store(StoreStockInicialRequest $request): RedirectResponse
    {
        Gate::authorize('stock-iniciales.create');

        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            StockInicial::create($data);

            $this->adjustStockBodega((int) $data['bodega_id'], (int) $data['producto_id'], (float) $data['cantidad']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Stock inicial created.')]);

        return back();
    }

    /**
     * Update the specified stock inicial.
     */
    public function update(UpdateStockInicialRequest $request, StockInicial $stock_inicial): RedirectResponse
    {
        Gate::authorize('stock-iniciales.update');

        $data = $request->validated();

        DB::transaction(function () use ($stock_inicial, $data): void {
            $this->adjustStockBodega((int) $stock_inicial->bodega_id, (int) $stock_inicial->producto_id, -(float) $stock_inicial->cantidad);

            $stock_inicial->update($data);

            $this->adjustStockBodega((int) $data['bodega_id'], (int) $data['producto_id'], (float) $data['cantidad']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Stock inicial updated.')]);

        return back();
    }

    /**
     * Remove the specified stock inicial.
     */
    public function destroy(StockInicial $stock_inicial): RedirectResponse
    {
        Gate::authorize('stock-iniciales.delete');

        DB::transaction(function () use ($stock_inicial): void {
            $this->adjustStockBodega((int) $stock_inicial->bodega_id, (int) $stock_inicial->producto_id, -(float) $stock_inicial->cantidad);

            $stock_inicial->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Stock inicial deleted.')]);

        return back();
    }

    /**
     * Apply (or revert) a stock inicial quantity to the warehouse stock.
     */
    private function adjustStockBodega(int $bodegaId, int $productoId, float $cantidad): void
    {
        $stockBodega = StockBodega::firstOrNew([
            'bodega_id' => $bodegaId,
            'producto_id' => $productoId,
        ]);

        $stockBodega->stock_inicial = (float) ($stockBodega->stock_inicial ?? 0) + $cantidad;
        $stockBodega->stock = (float) ($stockBodega->stock ?? 0) + $cantidad;
        $stockBodega->save();
    }
}
