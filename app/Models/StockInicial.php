<?php

namespace App\Models;

use App\Models\Concerns\LogsCambios;
use Database\Factories\StockInicialFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockInicial extends Model
{
    /** @use HasFactory<StockInicialFactory> */
    use HasFactory;

    use LogsCambios;

    protected $fillable = [
        'producto_id',
        'bodega_id',
        'cantidad',
    ];

    /**
     * @return BelongsTo<Producto, $this>
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    /**
     * @return BelongsTo<Bodega, $this>
     */
    public function bodega(): BelongsTo
    {
        return $this->belongsTo(Bodega::class);
    }

    /**
     * @return list<string>
     */
    protected function logCampos(): array
    {
        return ['producto_id', 'bodega_id', 'cantidad'];
    }

    /**
     * @return array{0: string, 1: bool}
     */
    protected function logEtiqueta(): array
    {
        return ['Stock inicial', false];
    }
}
