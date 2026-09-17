<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Traslado extends Model
{
    /** @use HasFactory<\Database\Factories\TrasladoFactory> */
    use HasFactory;

    protected $fillable = [
        'bodega_donante_id',
        'bodega_destino_id',
        'producto_id',
        'cantidad',
        'observaciones',
    ];

    public function bodegaDonante()
    {
        return $this->belongsTo(Bodega::class, 'bodega_donante_id');
    }
    public function bodegaDestino()
    {
        return $this->belongsTo(Bodega::class, 'bodega_destino_id');
    }
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
