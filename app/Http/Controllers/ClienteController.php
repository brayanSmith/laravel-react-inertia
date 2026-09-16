<?php

namespace App\Http\Controllers;

use App\Http\Requests\Clientes\StoreClienteRequest;
use App\Http\Requests\Clientes\UpdateClienteRequest;
use App\Models\Cliente;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClienteController extends Controller
{
    /**
     * Display a listing of the clients.
     */
    public function index(): Response
    {
        return Inertia::render('clientes/index', [
            'clientes' => Cliente::query()
                ->orderBy('nombre')
                ->orderBy('apellido')
                ->get(['id', 'nombre', 'apellido', 'n_documento', 'direccion', 'email', 'telefono']),
        ]);
    }

    /**
     * Store a newly created client.
     */
    public function store(StoreClienteRequest $request): RedirectResponse
    {
        Cliente::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Cliente creado.')]);

        return back();
    }

    /**
     * Update the specified client.
     */
    public function update(UpdateClienteRequest $request, Team $current_team, Cliente $cliente): RedirectResponse
    {
        $cliente->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Cliente actualizado.')]);

        return back();
    }

    /**
     * Remove the specified client.
     */
    public function destroy(Team $current_team, Cliente $cliente): RedirectResponse
    {
        $cliente->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Cliente eliminado.')]);

        return back();
    }
}
