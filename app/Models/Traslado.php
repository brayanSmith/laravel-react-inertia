<?php

namespace App\Models;

use App\Models\Concerns\LogsCambios;
use Database\Factories\TrasladoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Traslado extends Model
{
    /** @use HasFactory<TrasladoFactory> */
    use HasFactory;

    use LogsCambios;

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

    /**
     * @return list<string>
     */
    protected function logCampos(): array
    {
        return ['bodega_donante_id', 'bodega_destino_id', 'producto_id', 'cantidad', 'observaciones'];
    }

    /**
     * @return array{0: string, 1: bool}
     */
    protected function logEtiqueta(): array
    {
        return ['Traslado', false];
    }
}
