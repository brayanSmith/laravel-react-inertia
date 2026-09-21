<?php

namespace App\Models;

use App\Models\Concerns\LogsDetalles;
use Database\Factories\CompraFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Compra extends Model
{
    /** @use HasFactory<CompraFactory> */
    use HasFactory;

    use LogsActivity;
    use LogsDetalles;
    use SoftDeletes;

    protected $casts = [
        'fecha' => 'datetime',
        'subtotal' => 'decimal:2',
        'descuento' => 'decimal:2',
        'total_a_pagar' => 'decimal:2',
    ];

    protected $fillable = [
        'factura',
        'proveedor_id',
        'fecha',
        'estado',
        'observaciones',
        'subtotal',
        'descuento',
        'total_a_pagar',
    ];

    /**
     * What gets written to the history. The totals and the estado are left
     * out: they come from the lines, which are logged on their own.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('compras')
            ->logOnly(['factura', 'proveedor_id', 'fecha', 'descuento', 'observaciones'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $event): string => match ($event) {
                'created' => 'Compra creada',
                'updated' => 'Compra editada',
                'deleted' => 'Compra eliminada',
                'restored' => 'Compra restaurada',
                default => "Compra {$event}",
            });
    }

    /**
     * The lines of the compra as plain data, to compare before and after an
     * edit and to write them to the history.
     *
     * @return list<array{producto: string, bodega: string, cantidad: float, precio_unitario: float, estado: string}>
     */
    public function resumenDetalles(): array
    {
        return $this->detallesCompra()
            ->with(['producto:id,concatenar_codigo_nombre,referencia_producto', 'bodega:id,nombre_bodega'])
            ->orderBy('id')
            ->get()
            ->map(fn (DetalleCompra $detalle): array => [
                'producto' => $detalle->producto?->concatenar_codigo_nombre ?? $detalle->producto?->referencia_producto ?? 'Producto '.$detalle->producto_id,
                'bodega' => $detalle->bodega?->nombre_bodega ?? '—',
                'cantidad' => (float) $detalle->cantidad,
                'precio_unitario' => (float) $detalle->precio_unitario,
                'estado' => $detalle->estado_entrega,
            ])
            ->all();
    }

    private function etiquetaDetalles(): string
    {
        return 'Productos de la compra';
    }

    /**
     * @return BelongsTo<Proveedor, $this>
     */
    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    /**
     * @return HasMany<DetalleCompra, $this>
     */
    public function detallesCompra(): HasMany
    {
        return $this->hasMany(DetalleCompra::class);
    }

    /**
     * @return Attribute<string, never>
     */
    protected function titulo(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->id} - {$this->factura}",
        );
    }
}
