<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\Pedido;

/**
 * The data printed on a pedido's payment voucher (turno, remisión, cliente,
 * products, totals, abono and balance), plus the company's letterhead.
 */
class PedidoVoucher
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Pedido $pedido): array
    {
        $pedido->loadMissing(['cliente', 'user', 'detalles.producto']);
        $empresa = Empresa::first();

        return [
            'empresa' => [
                'nombre' => $empresa?->nombre_empresa,
                'direccion' => $empresa?->direccion_empresa,
                'telefono' => $empresa?->telefono_empresa,
                'nit' => $empresa?->nit_empresa,
                'logo_url' => $empresa?->logo_empresa_url,
            ],
            'pedido' => [
                'id' => $pedido->id,
                'turno' => $pedido->turno,
                'fecha' => $pedido->fecha?->format('d/m/Y H:i'),
                'placa' => $pedido->placa,
                'facturacion_electronica' => (bool) $pedido->facturacion_electronica,
                'observacion' => $pedido->observacion,
                'observacion_pago' => $pedido->observacion_pago,
                'subtotal' => (float) $pedido->subtotal,
                'descuento' => (float) $pedido->descuento,
                'flete' => (float) $pedido->flete,
                'retefuente' => (float) $pedido->retefuente,
                'reteica' => (float) $pedido->reteica,
                'total_a_pagar' => (float) $pedido->total_a_pagar,
                'abono' => (float) $pedido->abono,
                'saldo_pendiente' => (float) $pedido->saldo_pendiente,
            ],
            'vendedor' => $pedido->user?->name,
            'cliente' => [
                'razon_social' => $pedido->cliente?->razon_social,
                'numero_documento' => $pedido->cliente?->numero_documento,
                'ciudad' => $pedido->cliente?->ciudad,
                'direccion' => $pedido->cliente?->direccion,
                'telefono' => $pedido->cliente?->telefono,
                'email' => $pedido->cliente?->email,
            ],
            'detalles' => $pedido->detalles->map(fn ($detalle): array => [
                'nombre' => $detalle->producto?->concatenar_codigo_nombre ?? $detalle->producto?->referencia_producto ?? 'Producto '.$detalle->producto_id,
                'cantidad' => (float) $detalle->cantidad,
                'total' => (float) $detalle->subtotal,
            ])->all(),
        ];
    }
}
