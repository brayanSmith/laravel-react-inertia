<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Marca extends Model
{
    //
    protected $fillable = [
        'marca',
        'descripcion_marca',
    ];

    public function productos()
    {
        return $this->hasMany(Producto::class);
    }
}
