<?php

namespace App\Http\Controllers;

use App\Http\Requests\Abonos\StoreAbonoRequest;
use App\Http\Requests\Abonos\UpdateAbonoRequest;
use App\Models\Abono;
use App\Models\Pedido;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Serves payments for both the "pedidos" and "pedidos-mayoristas" modules;
 * see PedidoController for why the module is derived from the route name.
 */
class AbonoController extends Controller
{
    /**
     * Store a newly created payment (abono) for the pedido.
     */
    public function store(StoreAbonoRequest $request, Pedido $pedido): RedirectResponse
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.update");
        Gate::authorize("{$module}.create-abono");

        $data = $request->validated();

        DB::transaction(function () use ($request, $pedido, $data): void {
            $conCuantoPago = isset($data['con_cuanto_pago']) ? (float) $data['con_cuanto_pago'] : (float) $data['monto'];
            // Paying less than the monto is a partial abono: only what was paid counts.
            $monto = min((float) $data['monto'], $conCuantoPago);

            $pedido->abonos()->create([
                'fecha' => $data['fecha'] ?? now(),
                'monto' => $monto,
                'con_cuanto_pago' => $conCuantoPago,
                'cambio' => max($conCuantoPago - $monto, 0),
                'puc_id' => $data['puc_id'],
                'descripcion' => $data['descripcion'] ?? null,
                'user_id' => $request->user()->id,
                'vendedor_id' => $data['vendedor_id'] ?? null,
            ]);

            $pedido->recalcularTotales();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pago registrado.')]);

        return to_route("{$module}.edit", ['pedido' => $pedido]);
    }

    /**
     * Update the specified payment (abono).
     */
    public function update(UpdateAbonoRequest $request, Pedido $pedido, Abono $abono): RedirectResponse
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.update");
        Gate::authorize("{$module}.update-abono");

        $data = $request->validated();

        DB::transaction(function () use ($pedido, $abono, $data): void {
            $conCuantoPago = isset($data['con_cuanto_pago']) ? (float) $data['con_cuanto_pago'] : (float) $data['monto'];
            // Paying less than the monto is a partial abono: only what was paid counts.
            $monto = min((float) $data['monto'], $conCuantoPago);

            $abono->update([
                'fecha' => $data['fecha'] ?? $abono->fecha,
                'monto' => $monto,
                'con_cuanto_pago' => $conCuantoPago,
                'cambio' => max($conCuantoPago - $monto, 0),
                'puc_id' => $data['puc_id'],
                'descripcion' => $data['descripcion'] ?? null,
                'vendedor_id' => $data['vendedor_id'] ?? null,
            ]);

            $pedido->recalcularTotales();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pago actualizado.')]);

        return to_route("{$module}.edit", ['pedido' => $pedido]);
    }

    /**
     * Remove the specified payment (abono).
     */
    public function destroy(Request $request, Pedido $pedido, Abono $abono): RedirectResponse
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.update");
        Gate::authorize("{$module}.delete-abono");

        DB::transaction(function () use ($pedido, $abono): void {
            $abono->delete();
            $pedido->recalcularTotales();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pago eliminado.')]);

        return to_route("{$module}.edit", ['pedido' => $pedido]);
    }

    /**
     * The active module ("pedidos" or "pedidos-mayoristas"), derived from
     * the matched route's name (e.g. "pedidos-mayoristas.abonos.store").
     */
    private function module(Request $request): string
    {
        return Str::before($request->route()->getName(), '.');
    }
}
