<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockBodega extends Model
{
    /** @use HasFactory<\Database\Factories\StockBodegaFactory> */
    use HasFactory;

    protected $fillable = [
        'bodega_id',
        'producto_id',
        'entradas',
        'salidas',
        'stock',
    ];

    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
