<?php

namespace App\Services;

use App\Models\Bodega;
use App\Models\DetallePedido;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\StockBodega;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Writes pedidos and their detalles, keeping warehouse stock in sync.
 * Shared by every entry point that creates or edits a pedido (the regular
 * pedidos modules and the POS screen) so the rules live in one place.
 */
class PedidoService
{
    /**
     * Create a pedido with its detalles from validated request data.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Pedido
    {
        return DB::transaction(function () use ($data): Pedido {
            $aplicaTurno = (bool) ($data['aplica_turno'] ?? false);

            $pedido = Pedido::create([
                'cliente_id' => $data['cliente_id'],
                'fecha' => $data['fecha'],
                'user_id' => $data['user_id'],
                'bodega_id' => $data['bodega_id'],
                'tipo_precio' => $data['tipo_precio'],
                'placa' => $data['placa'] ?? null,
                'facturacion_electronica' => $data['facturacion_electronica'] ?? false,
                'aplica_turno' => $aplicaTurno,
                'turno' => $aplicaTurno ? $this->generarTurno((int) $data['bodega_id'], Carbon::parse($data['fecha'])) : null,
                'tipo_pago' => $data['tipo_pago'] ?? 'CONTADO',
                'observacion' => $data['observacion'] ?? null,
                'observacion_pago' => $data['observacion_pago'] ?? null,
                'flete' => $data['flete'] ?? 0,
                'descuento' => $data['descuento'] ?? 0,
                'reteica' => $data['reteica'] ?? 0,
                'retefuente' => $data['retefuente'] ?? 0,
                'subtotal' => 0,
                'total_a_pagar' => 0,
            ]);

            $this->syncDetalles($pedido, $data['detalles']);
            $this->registrarAbonos($pedido, $data['abonos'] ?? []);

            return $pedido;
        });
    }

    /**
     * The turno for a new pedido: the first three letters/digits of the
     * bodega's name, a dash, and the pedido's number among that bodega's
     * turnos of the day (America/Bogota) — e.g. "OUT-0001", "OUT-0002", and
     * back to 0001 the next day.
     */
    private function generarTurno(int $bodegaId, Carbon $fecha): string
    {
        $dia = $fecha->copy()->setTimezone('America/Bogota');

        $numero = Pedido::where('bodega_id', $bodegaId)
            ->whereNotNull('turno')
            ->whereBetween('fecha', [
                $dia->copy()->startOfDay()->utc(),
                $dia->copy()->endOfDay()->utc(),
            ])
            ->lockForUpdate()
            ->count() + 1;

        $nombre = (string) Bodega::whereKey($bodegaId)->value('nombre_bodega');
        $prefijo = Str::upper(Str::substr(preg_replace('/[^\p{L}\p{N}]/u', '', $nombre) ?? '', 0, 3));

        return "{$prefijo}-".str_pad((string) $numero, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Register the payments (abonos) taken at checkout and refresh the
     * pedido's paid / pending amounts and estado.
     *
     * @param  array<int, array{puc_id: int, monto: float|string, con_cuanto_pago?: float|string|null, descripcion?: string|null}>  $abonos
     */
    public function registrarAbonos(Pedido $pedido, array $abonos): void
    {
        if ($abonos === []) {
            return;
        }

        foreach ($abonos as $abono) {
            $monto = (float) $abono['monto'];
            $conCuantoPago = isset($abono['con_cuanto_pago']) ? (float) $abono['con_cuanto_pago'] : $monto;

            $pedido->abonos()->create([
                'fecha' => now(),
                'monto' => $monto,
                'con_cuanto_pago' => $conCuantoPago,
                'cambio' => max($conCuantoPago - $monto, 0),
                'puc_id' => $abono['puc_id'],
                'descripcion' => $abono['descripcion'] ?? null,
                'user_id' => Auth::id(),
                'vendedor_id' => $pedido->user_id,
            ]);
        }

        $pedido->recalcularTotales();
    }

    /**
     * Replace the pedido's detalles, recomputing totals and warehouse stock.
     *
     * @param  array<int, array{producto_id: int, bodega_id?: int|null, cantidad: float|string, precio_unitario: float|string}>  $detalles
     */
    public function syncDetalles(Pedido $pedido, array $detalles): void
    {
        $subtotal = 0;

        $productos = Producto::whereIn('id', array_column($detalles, 'producto_id'))
            ->get(['id', 'costo_producto'])
            ->keyBy('id');

        foreach ($detalles as $item) {
            $cantidad = (float) $item['cantidad'];
            $precioUnitario = (float) $item['precio_unitario'];
            $itemSubtotal = $cantidad * $precioUnitario;
            $subtotal += $itemSubtotal;

            $costoUnitario = (float) ($productos->get($item['producto_id'])?->costo_producto ?? 0);
            $costoTotal = $costoUnitario * $cantidad;

            $detalle = $pedido->detalles()->create([
                'producto_id' => $item['producto_id'],
                'bodega_id' => $item['bodega_id'] ?? $pedido->bodega_id,
                'cantidad' => $cantidad,
                'precio_unitario' => $precioUnitario,
                'subtotal' => $itemSubtotal,
                'costo_unitario' => $costoUnitario,
                'costo_total' => $costoTotal,
                'ganancia_total' => $itemSubtotal - $costoTotal,
            ]);

            $this->adjustStock($detalle, $pedido, -1);
        }

        $descuento = (float) $pedido->descuento;
        $flete = (float) $pedido->flete;
        $reteica = (float) $pedido->reteica;
        $retefuente = (float) $pedido->retefuente;

        $pedido->update([
            'subtotal' => $subtotal,
            'total_a_pagar' => max($subtotal + $flete - $descuento - $reteica - $retefuente, 0),
        ]);

        $pedido->recalcularTotales();
    }

    /**
     * Apply (sign -1) or revert (sign +1) a detalle's quantity on the
     * pedido's warehouse stock.
     */
    public function adjustStock(DetallePedido $detalle, Pedido $pedido, int $sign): void
    {
        $stockBodega = StockBodega::firstOrNew([
            'bodega_id' => $detalle->bodega_id ?? $pedido->bodega_id,
            'producto_id' => $detalle->producto_id,
        ]);

        $cantidad = (float) $detalle->cantidad;

        $stockBodega->salidas = (float) ($stockBodega->salidas ?? 0) + ($sign < 0 ? $cantidad : 0);
        $stockBodega->stock = (float) ($stockBodega->stock ?? 0) + $sign * $cantidad;
        $stockBodega->save();
    }
}
