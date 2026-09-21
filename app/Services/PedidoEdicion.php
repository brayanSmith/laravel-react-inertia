<?php

namespace App\Services;

use App\Models\Pedido;
use App\Models\User;

/**
 * What a user may change when editing a pedido. Changing the general data,
 * adding, editing or removing products are separate permissions, so the
 * submitted form is reduced to what the user is allowed to do: anything
 * they may not change keeps the value the pedido already has.
 */
class PedidoEdicion
{
    /** The header fields covered by `{module}.update-datos` (observaciones are always editable). */
    private const CAMPOS_DATOS = [
        'cliente_id', 'fecha', 'user_id', 'bodega_id', 'tipo_precio',
        'placa', 'facturacion_electronica', 'flete', 'descuento', 'reteica', 'retefuente',
    ];

    /**
     * @param  array<string, mixed>  $data  The validated form.
     * @return array<string, mixed> The same form limited to what $user may change.
     */
    public function restringir(Pedido $pedido, array $data, User $user, string $module): array
    {
        if (! $user->can("{$module}.update-datos")) {
            foreach (self::CAMPOS_DATOS as $campo) {
                $data[$campo] = $pedido->getRawOriginal($campo);
            }
        }

        $data['detalles'] = $this->detalles($pedido, $data['detalles'], $user, $module);

        return $data;
    }

    /**
     * @param  array<int, array<string, mixed>>  $enviados
     * @return list<array<string, mixed>>
     */
    private function detalles(Pedido $pedido, array $enviados, User $user, string $module): array
    {
        $puedeAgregar = $user->can("{$module}.create-detalle");
        $puedeEditar = $user->can("{$module}.update-detalle");
        $puedeEliminar = $user->can("{$module}.delete-detalle");

        if ($puedeAgregar && $puedeEditar && $puedeEliminar) {
            return array_values($enviados);
        }

        $enviadosPorProducto = collect($enviados)->keyBy('producto_id');
        $resultado = [];

        foreach ($pedido->detalles as $existente) {
            $enviado = $enviadosPorProducto->get($existente->producto_id);

            if ($enviado === null) {
                // The line was removed in the form.
                if (! $puedeEliminar) {
                    $resultado[] = $this->comoEstaba($existente);
                }

                continue;
            }

            $cambio = (float) $enviado['cantidad'] !== (float) $existente->cantidad
                || (float) $enviado['precio_unitario'] !== (float) $existente->precio_unitario;

            $resultado[] = $cambio && $puedeEditar
                ? $enviado + ['bodega_id' => $existente->bodega_id]
                : $this->comoEstaba($existente);
        }

        if ($puedeAgregar) {
            $existentes = $pedido->detalles->pluck('producto_id');

            foreach ($enviadosPorProducto as $productoId => $enviado) {
                if (! $existentes->contains($productoId)) {
                    $resultado[] = $enviado;
                }
            }
        }

        return $resultado;
    }

    /**
     * @return array<string, mixed>
     */
    private function comoEstaba(object $detalle): array
    {
        return [
            'producto_id' => $detalle->producto_id,
            'bodega_id' => $detalle->bodega_id,
            'cantidad' => $detalle->cantidad,
            'precio_unitario' => $detalle->precio_unitario,
        ];
    }
}
