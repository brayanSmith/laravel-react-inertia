<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Pedido extends Model
{
    //
    use HasFactory;
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'codigo',
        'cliente_id',
        'fecha',
        'estado',
        'estado_pago',
        // 'tipo_pedido',
        'tipo_pago',
        'tipo_precio',
        'id_puc',
        'bodega_id',
        'observacion',
        'observacion_pago',
        'subtotal',
        'descuento',
        'flete',
        'total_a_pagar',
        'abono',
        'saldo_pendiente',
        'user_id',
        'aplica_turno',
        'turno',
        'placa',
        'reteica',
        'retefuente',
        'facturacion_electronica',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'fecha_vencimiento' => 'datetime',
        'fecha_ultimo_abono' => 'datetime',
        'reteica' => 'decimal:2',
        'retefuente' => 'decimal:2',
        'facturacion_electronica' => 'boolean',
    ];

    /**
     * What gets written to the history. Totals, balance and states are left
     * out on purpose: they are derived from the products and the abonos,
     * which are logged on their own.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('pedidos')
            ->logOnly([
                'cliente_id', 'fecha', 'user_id', 'bodega_id', 'tipo_precio', 'tipo_pago', 'turno',
                'placa', 'facturacion_electronica', 'observacion', 'observacion_pago',
                'flete', 'descuento', 'reteica', 'retefuente',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $event): string => match ($event) {
                'created' => 'Pedido creado',
                'updated' => 'Pedido editado',
                'deleted' => 'Pedido eliminado',
                'restored' => 'Pedido restaurado',
                default => "Pedido {$event}",
            });
    }

    /**
     * The lines of the pedido as plain data, to compare before and after an
     * edit and to write them to the history.
     *
     * @return list<array{producto: string, cantidad: float, precio_unitario: float}>
     */
    public function resumenDetalles(): array
    {
        return $this->detalles()
            ->with('producto:id,concatenar_codigo_nombre,referencia_producto')
            ->orderBy('id')
            ->get()
            ->map(fn (DetallePedido $detalle): array => [
                'producto' => $detalle->producto?->concatenar_codigo_nombre ?? $detalle->producto?->referencia_producto ?? 'Producto '.$detalle->producto_id,
                'cantidad' => (float) $detalle->cantidad,
                'precio_unitario' => (float) $detalle->precio_unitario,
            ])
            ->all();
    }

    /**
     * Writes a "productos" entry to the history when the lines of the pedido
     * changed (or when there were none before, i.e. on creation).
     *
     * @param  list<array{producto: string, cantidad: float, precio_unitario: float}>|null  $antes
     */
    public function registrarCambioDetalles(?array $antes, float $totalAntes = 0.0): void
    {
        $despues = $this->resumenDetalles();

        if ($antes === $despues) {
            return;
        }

        activity('pedidos')
            ->performedOn($this)
            ->event('detalles')
            ->withProperties([
                'old' => $antes === null ? [] : ['productos' => $antes, 'total_a_pagar' => $totalAntes],
                'attributes' => ['productos' => $despues, 'total_a_pagar' => (float) $this->fresh()->total_a_pagar],
            ])
            ->log($antes === null ? 'Productos del pedido' : 'Productos del pedido modificados');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function detalles()
    {
        return $this->hasMany(DetallePedido::class);
    }

    public function abonoPedido()
    {
        return $this->hasMany(Abono::class);
    }

    // Alias para compatibilidad - obtener todos los abonos
    public function abonos()
    {
        return $this->hasMany(Abono::class);
    }

    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function alistador()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function puc()
    {
        return $this->belongsTo(Puc::class, 'id_puc');
    }

    /**
     * Recompute abono, saldo_pendiente, estado_pago and estado from the
     * pedido's persisted abonos and current total_a_pagar.
     */
    public function recalcularTotales(): void
    {
        $abono = (float) $this->abonos()->sum('monto');
        $totalAPagar = (float) $this->total_a_pagar;
        $saldoPendiente = max($totalAPagar - $abono, 0);

        $this->update([
            'abono' => $abono,
            'saldo_pendiente' => $saldoPendiente,
            'estado_pago' => $saldoPendiente <= 0 && $totalAPagar > 0 ? 'SALDADO' : 'EN_CARTERA',
            'estado' => $saldoPendiente <= 0 ? 'COMPLETADO' : 'PENDIENTE',
        ]);
    }

    // Atributo: devolver fecha en America/Bogota
    public function getFechaAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }

        return Carbon::parse($value)->setTimezone('America/Bogota');
    }
}
