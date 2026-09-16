<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Almacen extends Model
{
    //
    protected $fillable = [
        'nombre',
        'direccion',
    ];

    public function stockBodegas()
    {
        return $this->hasMany(StockBodega::class);
    }
}
