<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    //
    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'costo',
        'precio_detal',
        'precio_mayorista',
        'precio_especial',
        'imagen',
    ];

    public function stockBodegas()
    {
        return $this->hasMany(StockBodega::class);
    }
}
