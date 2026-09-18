<?php

namespace App\Models;

use Database\Factories\CompraFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Compra extends Model
{
    /** @use HasFactory<CompraFactory> */
    use HasFactory;

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
