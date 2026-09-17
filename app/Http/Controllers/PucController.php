<?php

namespace App\Http\Controllers;

use App\Http\Requests\Pucs\StorePucRequest;
use App\Http\Requests\Pucs\UpdatePucRequest;
use App\Models\Puc;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PucController extends Controller
{
    /**
     * Display a listing of pucs.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('puc.view');

        return Inertia::render('pucs/index', [
            'pucs' => Puc::orderBy('tipo')->orderBy('subcuenta')->get(),
            'permissions' => [
                'canCreate' => $request->user()->can('puc.create'),
                'canUpdate' => $request->user()->can('puc.update'),
                'canDelete' => $request->user()->can('puc.delete'),
            ],
        ]);
    }

    /**
     * Store a newly created puc.
     */
    public function store(StorePucRequest $request): RedirectResponse
    {
        Gate::authorize('puc.create');

        $data = $request->validated();
        $data['concatenar_subcuenta_concepto'] = "{$data['subcuenta']} - {$data['concepto']}";

        Puc::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Puc created.')]);

        return back();
    }

    /**
     * Update the specified puc.
     */
    public function update(UpdatePucRequest $request, string $current_team, Puc $puc): RedirectResponse
    {
        Gate::authorize('puc.update');

        $data = $request->validated();
        $data['concatenar_subcuenta_concepto'] = "{$data['subcuenta']} - {$data['concepto']}";

        $puc->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Puc updated.')]);

        return back();
    }

    /**
     * Remove the specified puc.
     */
    public function destroy(string $current_team, Puc $puc): RedirectResponse
    {
        Gate::authorize('puc.delete');

        if ($puc->abonos()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This puc cannot be deleted because it still has abonos associated with it.')]);

            return back();
        }

        $puc->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Puc deleted.')]);

        return back();
    }
}
