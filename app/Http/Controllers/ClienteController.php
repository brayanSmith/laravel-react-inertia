<?php

namespace App\Http\Controllers;

use App\Http\Requests\Clientes\StoreClienteRequest;
use App\Http\Requests\Clientes\UpdateClienteRequest;
use App\Models\Cliente;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ClienteController extends Controller
{
    /**
     * Display a listing of clientes.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('clientes.view');

        return Inertia::render('clientes/index', [
            'clientes' => Cliente::orderBy('razon_social')->get(),
            'permissions' => [
                'canCreate' => $request->user()->can('clientes.create'),
                'canUpdate' => $request->user()->can('clientes.update'),
                'canDelete' => $request->user()->can('clientes.delete'),
            ],
        ]);
    }

    /**
     * Store a newly created cliente.
     */
    public function store(StoreClienteRequest $request): RedirectResponse
    {
        Gate::authorize('clientes.create');

        $data = $request->validated();

        if ($request->hasFile('rut_imagen')) {
            $data['rut_imagen'] = $request->file('rut_imagen')->store('clientes', 'public');
        }

        Cliente::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Cliente created.')]);

        return back();
    }

    /**
     * Update the specified cliente.
     */
    public function update(UpdateClienteRequest $request, string $current_team, Cliente $cliente): RedirectResponse
    {
        Gate::authorize('clientes.update');

        $data = $request->safe()->except(['rut_imagen', 'remove_rut_imagen']);

        if ($request->hasFile('rut_imagen')) {
            if ($cliente->rut_imagen) {
                Storage::disk('public')->delete($cliente->rut_imagen);
            }

            $data['rut_imagen'] = $request->file('rut_imagen')->store('clientes', 'public');
        } elseif ($request->boolean('remove_rut_imagen') && $cliente->rut_imagen) {
            Storage::disk('public')->delete($cliente->rut_imagen);
            $data['rut_imagen'] = null;
        }

        $cliente->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Cliente updated.')]);

        return back();
    }

    /**
     * Remove the specified cliente.
     */
    public function destroy(string $current_team, Cliente $cliente): RedirectResponse
    {
        Gate::authorize('clientes.delete');

        $cliente->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Cliente deleted.')]);

        return back();
    }
}
