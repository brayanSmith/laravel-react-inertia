<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockInicial extends Model
{
    //
    protected $fillable = [
        'producto_id',
        'bodega_id',
        'cantidad',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }
    public function bodega()
    {
        return $this->belongsTo(Bodega::class);
    }
}
