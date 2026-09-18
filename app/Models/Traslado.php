<?php

namespace App\Models;

use Database\Factories\TrasladoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Traslado extends Model
{
    /** @use HasFactory<TrasladoFactory> */
    use HasFactory;

    protected $fillable = [
        'bodega_donante_id',
        'bodega_destino_id',
        'producto_id',
        'cantidad',
        'observaciones',
    ];

    /**
     * @return BelongsTo<Bodega, $this>
     */
    public function bodegaDonante(): BelongsTo
    {
        return $this->belongsTo(Bodega::class, 'bodega_donante_id');
    }

    /**
     * @return BelongsTo<Bodega, $this>
     */
    public function bodegaDestino(): BelongsTo
    {
        return $this->belongsTo(Bodega::class, 'bodega_destino_id');
    }

    /**
     * @return BelongsTo<Producto, $this>
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
