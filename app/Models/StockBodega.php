<?php

namespace App\Models;

use Database\Factories\StockBodegaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockBodega extends Model
{
    /** @use HasFactory<StockBodegaFactory> */
    use HasFactory;

    protected $fillable = [
        'bodega_id',
        'producto_id',
        'stock_inicial',
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
