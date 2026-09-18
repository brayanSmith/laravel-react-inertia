<?php

namespace App\Http\Controllers;

use App\Http\Requests\Abonos\StoreAbonoRequest;
use App\Http\Requests\Abonos\UpdateAbonoRequest;
use App\Models\Abono;
use App\Models\Pedido;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class AbonoController extends Controller
{
    /**
     * Store a newly created payment (abono) for the pedido.
     */
    public function store(StoreAbonoRequest $request, string $current_team, Pedido $pedido): RedirectResponse
    {
        Gate::authorize('pedidos.update');

        $data = $request->validated();

        DB::transaction(function () use ($request, $pedido, $data): void {
            $monto = (float) $data['monto'];
            $conCuantoPago = isset($data['con_cuanto_pago']) ? (float) $data['con_cuanto_pago'] : $monto;

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

        return to_route('pedidos.edit', ['current_team' => $current_team, 'pedido' => $pedido]);
    }

    /**
     * Update the specified payment (abono).
     */
    public function update(UpdateAbonoRequest $request, string $current_team, Pedido $pedido, Abono $abono): RedirectResponse
    {
        Gate::authorize('pedidos.update');

        $data = $request->validated();

        DB::transaction(function () use ($pedido, $abono, $data): void {
            $monto = (float) $data['monto'];
            $conCuantoPago = isset($data['con_cuanto_pago']) ? (float) $data['con_cuanto_pago'] : $monto;

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

        return to_route('pedidos.edit', ['current_team' => $current_team, 'pedido' => $pedido]);
    }

    /**
     * Remove the specified payment (abono).
     */
    public function destroy(string $current_team, Pedido $pedido, Abono $abono): RedirectResponse
    {
        Gate::authorize('pedidos.update');

        DB::transaction(function () use ($pedido, $abono): void {
            $abono->delete();
            $pedido->recalcularTotales();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pago eliminado.')]);

        return to_route('pedidos.edit', ['current_team' => $current_team, 'pedido' => $pedido]);
    }
}
