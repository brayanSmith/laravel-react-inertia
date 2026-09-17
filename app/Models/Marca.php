<?php

namespace App\Models;

use Database\Factories\MarcaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Marca extends Model
{
    /** @use HasFactory<MarcaFactory> */
    use HasFactory;

    protected $fillable = [
        'marca',
        'descripcion_marca',
    ];

    public function productos()
    {
        return $this->hasMany(Producto::class);
    }
}
