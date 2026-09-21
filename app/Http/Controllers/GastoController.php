<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesTrash;
use App\Http\Requests\Gastos\StoreGastoRequest;
use App\Http\Requests\Gastos\UpdateGastoRequest;
use App\Models\Bodega;
use App\Models\Gasto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GastoController extends Controller
{
    use HandlesTrash;

    /**
     * Display a listing of gastos.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('gastos.view');

        $eliminados = $this->verEliminados($request, 'gastos');

        return Inertia::render('gastos/index', [
            'gastos' => Gasto::with('bodega')->orderByDesc('fecha_gasto')
                ->when($eliminados, fn ($query) => $query->onlyTrashed())
                ->get(),
            'eliminados' => $eliminados,
            'bodegas' => Bodega::orderBy('nombre_bodega')->get(['id', 'nombre_bodega']),
            'permissions' => [
                'canCreate' => $request->user()->can('gastos.create'),
                'canUpdate' => $request->user()->can('gastos.update'),
                'canDelete' => $request->user()->can('gastos.delete'),
                'canViewDeleted' => $request->user()->can('gastos.view-deleted'),
                'canRestore' => $request->user()->can('gastos.restore'),
            ],
        ]);
    }

    /**
     * Store a newly created gasto.
     */
    public function store(StoreGastoRequest $request): RedirectResponse
    {
        Gate::authorize('gastos.create');

        Gasto::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Gasto created.')]);

        return back();
    }

    /**
     * Update the specified gasto.
     */
    public function update(UpdateGastoRequest $request, Gasto $gasto): RedirectResponse
    {
        Gate::authorize('gastos.update');

        $gasto->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Gasto updated.')]);

        return back();
    }

    /**
     * Remove the specified gasto.
     */
    public function destroy(Gasto $gasto): RedirectResponse
    {
        Gate::authorize('gastos.delete');

        $gasto->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Gasto deleted.')]);

        return back();
    }

    /**
     * Restore a deleted gasto.
     */
    public function restore(Gasto $gasto): RedirectResponse
    {
        return $this->restaurarRegistro('gastos', $gasto, __('Gasto restored.'));
    }
}
