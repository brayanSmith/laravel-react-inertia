<?php

namespace App\Http\Controllers;

use App\Http\Requests\Bodegas\StoreBodegaRequest;
use App\Http\Requests\Bodegas\UpdateBodegaRequest;
use App\Models\Bodega;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BodegaController extends Controller
{
    /**
     * Display a listing of bodegas.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('bodegas.view');

        return Inertia::render('bodegas/index', [
            'bodegas' => Bodega::orderBy('nombre_bodega')->get(),
            'permissions' => [
                'canCreate' => $request->user()->can('bodegas.create'),
                'canUpdate' => $request->user()->can('bodegas.update'),
                'canDelete' => $request->user()->can('bodegas.delete'),
            ],
        ]);
    }

    /**
     * Store a newly created bodega.
     */
    public function store(StoreBodegaRequest $request): RedirectResponse
    {
        Gate::authorize('bodegas.create');

        Bodega::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bodega created.')]);

        return back();
    }

    /**
     * Update the specified bodega.
     */
    public function update(UpdateBodegaRequest $request, string $current_team, Bodega $bodega): RedirectResponse
    {
        Gate::authorize('bodegas.update');

        $bodega->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bodega updated.')]);

        return back();
    }

    /**
     * Remove the specified bodega.
     */
    public function destroy(string $current_team, Bodega $bodega): RedirectResponse
    {
        Gate::authorize('bodegas.delete');

        $hasAssociatedRecords = DB::table('pedidos')->where('bodega_id', $bodega->id)->exists()
            || DB::table('stock_bodegas')->where('bodega_id', $bodega->id)->exists()
            || DB::table('stock_inicials')->where('bodega_id', $bodega->id)->exists()
            || DB::table('detalle_compras')->where('bodega_id', $bodega->id)->exists();

        if ($hasAssociatedRecords) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This bodega cannot be deleted because it still has products or stock associated with it.')]);

            return back();
        }

        $bodega->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bodega deleted.')]);

        return back();
    }
}
