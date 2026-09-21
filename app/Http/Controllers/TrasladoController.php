<?php

namespace App\Http\Controllers;

use App\Http\Requests\Traslados\StoreTrasladoRequest;
use App\Http\Requests\Traslados\UpdateTrasladoRequest;
use App\Models\Bodega;
use App\Models\Producto;
use App\Models\StockBodega;
use App\Models\Traslado;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TrasladoController extends Controller
{
    /**
     * Display a listing of traslados.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('traslados.view');

        return Inertia::render('traslados/index', [
            'traslados' => Traslado::with(['producto', 'bodegaDonante', 'bodegaDestino'])->latest()->get(),
            'productos' => Producto::where('categoria', '!=', 'SERVICIO')
                ->where('inventariable', true)
                ->orderBy('referencia_producto')
                ->get(['id', 'referencia_producto', 'concatenar_codigo_nombre', 'costo_producto']),
            'bodegas' => Bodega::orderBy('nombre_bodega')->get(['id', 'nombre_bodega']),
            'permissions' => [
                'canCreate' => $request->user()->can('traslados.create'),
                'canUpdate' => $request->user()->can('traslados.update'),
                'canDelete' => $request->user()->can('traslados.delete'),
            ],
        ]);
    }

    /**
     * Store a newly created traslado.
     */
    public function store(StoreTrasladoRequest $request): RedirectResponse
    {
        Gate::authorize('traslados.create');

        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $traslado = Traslado::create($data);

            $this->applyTraslado($traslado, 1);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Traslado created.')]);

        return back();
    }

    /**
     * Update the specified traslado.
     */
    public function update(UpdateTrasladoRequest $request, Traslado $traslado): RedirectResponse
    {
        Gate::authorize('traslados.update');

        $data = $request->validated();

        DB::transaction(function () use ($traslado, $data): void {
            $this->applyTraslado($traslado, -1);

            $traslado->update($data);

            $this->applyTraslado($traslado, 1);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Traslado updated.')]);

        return back();
    }

    /**
     * Remove the specified traslado.
     */
    public function destroy(Traslado $traslado): RedirectResponse
    {
        Gate::authorize('traslados.delete');

        DB::transaction(function () use ($traslado): void {
            $this->applyTraslado($traslado, -1);

            $traslado->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Traslado deleted.')]);

        return back();
    }

    /**
     * Apply (or revert, with sign -1) a traslado's quantity to both warehouses' stock.
     */
    private function applyTraslado(Traslado $traslado, int $sign): void
    {
        $cantidad = (float) $traslado->cantidad;

        $this->adjustStockBodega((int) $traslado->bodega_donante_id, (int) $traslado->producto_id, 0, $sign * $cantidad);
        $this->adjustStockBodega((int) $traslado->bodega_destino_id, (int) $traslado->producto_id, $sign * $cantidad, 0);
    }

    /**
     * Apply entradas/salidas deltas to a warehouse's stock.
     */
    private function adjustStockBodega(int $bodegaId, int $productoId, float $entradasDelta, float $salidasDelta): void
    {
        $stockBodega = StockBodega::firstOrNew([
            'bodega_id' => $bodegaId,
            'producto_id' => $productoId,
        ]);

        $stockBodega->entradas = (float) ($stockBodega->entradas ?? 0) + $entradasDelta;
        $stockBodega->salidas = (float) ($stockBodega->salidas ?? 0) + $salidasDelta;
        $stockBodega->stock = (float) ($stockBodega->stock ?? 0) + $entradasDelta - $salidasDelta;
        $stockBodega->save();
    }
}
