<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Model
{
    //
    use HasFactory;
    use SoftDeletes;
    protected $fillable = [
        'tipo_documento',
        'numero_documento',
        'razon_social',
        'direccion',
        'telefono',
        'ciudad',
        'email',
        'activo',
        'novedad',
        'rut_imagen',
        'retenedor_fuente',
    ];

    public function pedidos()
    {
        return $this->hasMany(Pedido::class);
    }
}
