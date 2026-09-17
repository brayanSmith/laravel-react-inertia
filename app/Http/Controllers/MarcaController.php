<?php

namespace App\Http\Controllers;

use App\Http\Requests\Marcas\StoreMarcaRequest;
use App\Http\Requests\Marcas\UpdateMarcaRequest;
use App\Models\Marca;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MarcaController extends Controller
{
    /**
     * Display a listing of marcas.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('marcas.view');

        return Inertia::render('marcas/index', [
            'marcas' => Marca::orderBy('marca')->get(),
            'permissions' => [
                'canCreate' => $request->user()->can('marcas.create'),
                'canUpdate' => $request->user()->can('marcas.update'),
                'canDelete' => $request->user()->can('marcas.delete'),
            ],
        ]);
    }

    /**
     * Store a newly created marca.
     */
    public function store(StoreMarcaRequest $request): RedirectResponse
    {
        Gate::authorize('marcas.create');

        Marca::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Marca created.')]);

        return back();
    }

    /**
     * Update the specified marca.
     */
    public function update(UpdateMarcaRequest $request, string $current_team, Marca $marca): RedirectResponse
    {
        Gate::authorize('marcas.update');

        $marca->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Marca updated.')]);

        return back();
    }

    /**
     * Remove the specified marca.
     */
    public function destroy(string $current_team, Marca $marca): RedirectResponse
    {
        Gate::authorize('marcas.delete');

        if ($marca->productos()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This marca cannot be deleted because it still has products associated with it.')]);

            return back();
        }

        $marca->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Marca deleted.')]);

        return back();
    }
}
