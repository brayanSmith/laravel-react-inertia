<?php

namespace App\Models;

use Database\Factories\ProductoFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Producto extends Model
{
    /** @use HasFactory<ProductoFactory> */
    use HasFactory;

    use LogsActivity;
    use SoftDeletes;

    protected $appends = [
        'imagen_producto_url',
    ];

    protected $casts = [
        'inventariable' => 'boolean',
        'costo_producto' => 'decimal:2',
        'valor_detal' => 'decimal:2',
        'valor_mayorista' => 'decimal:2',
        'valor_sin_instalacion' => 'decimal:2',
    ];

    protected $fillable = [
        'categoria',
        'tipo',
        'inventariable',
        'ancho',
        'perfil',
        'construccion',
        'rin',
        'tipo_vehiculo',
        'diametro',
        'marca_id',
        'referencia_producto',
        'descripcion_producto',
        'costo_producto',
        'valor_detal',
        'valor_mayorista',
        'valor_sin_instalacion',
        'imagen_producto',
        'concatenar_codigo_nombre',
        'codigo_appsheet',
        'sku',
    ];

    /**
     * What gets written to the history. The composed name and the image path
     * are left out: they follow from the fields below.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('productos')
            ->logOnly([
                'categoria', 'tipo', 'inventariable', 'sku', 'referencia_producto', 'descripcion_producto', 'marca_id',
                'ancho', 'perfil', 'construccion', 'rin', 'tipo_vehiculo', 'diametro',
                'costo_producto', 'valor_detal', 'valor_mayorista', 'valor_sin_instalacion',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $event): string => match ($event) {
                'created' => 'Producto creado',
                'updated' => 'Producto editado',
                'deleted' => 'Producto eliminado',
                'restored' => 'Producto restaurado',
                default => "Producto {$event}",
            });
    }

    /**
     * @return BelongsTo<Marca, $this>
     */
    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    public function detalleCompras()
    {
        return $this->hasMany(DetalleCompra::class);
    }

    public function detallePedidos()
    {
        return $this->hasMany(DetallePedido::class);
    }

    public function traslados()
    {
        return $this->hasMany(Traslado::class);
    }

    public function stockBodegas()
    {
        return $this->hasMany(StockBodega::class);
    }

    public function stockIniciales()
    {
        return $this->hasMany(StockInicial::class);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function imagenProductoUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->imagen_producto ? Storage::disk('public')->url($this->imagen_producto) : null,
        );
    }

    public function enStock(float|int $cantidad): bool
    {
        // cantidad inválida
        if ($cantidad <= 0) {
            return false;
        }

        $stock = (float) ($this->stock ?? 0);

        return $stock >= (float) $cantidad;
    }
}
