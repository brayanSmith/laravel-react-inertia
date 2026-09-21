<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesTrash;
use App\Http\Requests\Proveedores\StoreProveedorRequest;
use App\Http\Requests\Proveedores\UpdateProveedorRequest;
use App\Models\Proveedor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProveedorController extends Controller
{
    use HandlesTrash;

    /**
     * Display a listing of proveedores.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('proveedores.view');

        $eliminados = $this->verEliminados($request, 'proveedores');

        return Inertia::render('proveedores/index', [
            'proveedores' => Proveedor::orderBy('nombre_proveedor')
                ->when($eliminados, fn ($query) => $query->onlyTrashed())
                ->get(),
            'eliminados' => $eliminados,
            'permissions' => [
                'canCreate' => $request->user()->can('proveedores.create'),
                'canUpdate' => $request->user()->can('proveedores.update'),
                'canDelete' => $request->user()->can('proveedores.delete'),
            ],
        ]);
    }

    /**
     * Store a newly created proveedor.
     */
    public function store(StoreProveedorRequest $request): RedirectResponse
    {
        Gate::authorize('proveedores.create');

        $data = $request->validated();

        if ($request->hasFile('rut_proveedor_imagen')) {
            $data['rut_proveedor_imagen'] = $request->file('rut_proveedor_imagen')->store('proveedores', 'public');
        }

        Proveedor::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Proveedor created.')]);

        return back();
    }

    /**
     * Update the specified proveedor.
     */
    public function update(UpdateProveedorRequest $request, string $current_team, Proveedor $proveedor): RedirectResponse
    {
        Gate::authorize('proveedores.update');

        $data = $request->safe()->except(['rut_proveedor_imagen', 'remove_rut_proveedor_imagen']);

        if ($request->hasFile('rut_proveedor_imagen')) {
            if ($proveedor->rut_proveedor_imagen) {
                Storage::disk('public')->delete($proveedor->rut_proveedor_imagen);
            }

            $data['rut_proveedor_imagen'] = $request->file('rut_proveedor_imagen')->store('proveedores', 'public');
        } elseif ($request->boolean('remove_rut_proveedor_imagen') && $proveedor->rut_proveedor_imagen) {
            Storage::disk('public')->delete($proveedor->rut_proveedor_imagen);
            $data['rut_proveedor_imagen'] = null;
        }

        $proveedor->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Proveedor updated.')]);

        return back();
    }

    /**
     * Remove the specified proveedor.
     */
    public function destroy(string $current_team, Proveedor $proveedor): RedirectResponse
    {
        Gate::authorize('proveedores.delete');

        $proveedor->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Proveedor deleted.')]);

        return back();
    }

    /**
     * Restore a deleted proveedor.
     */
    public function restore(string $current_team, Proveedor $proveedor): RedirectResponse
    {
        return $this->restaurarRegistro('proveedores', $proveedor, __('Proveedor restored.'));
    }
}
