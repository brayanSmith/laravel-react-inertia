<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proveedor extends Model
{
    /** @use HasFactory<\Database\Factories\ProveedorFactory> */
    use HasFactory;
    use SoftDeletes;



    protected $fillable = [
        'id',
        'nombre_proveedor',
        'razon_social_proveedor',
        'nit_proveedor',
        'rut_proveedor_imagen',
        'tipo_proveedor',
        'categoria_proveedor',
        'departamento_proveedor',
        'ciudad_proveedor',
        'direccion_proveedor',
        'telefono_proveedor',
        'banco_proveedor',
        'tipo_cuenta_proveedor',
        'numero_cuenta_proveedor',
        'convenio',
        'tiempo_respuesta',
        'fabricante',
        'flete',
        'valor_flete'
    ];

    public function compras()
    {
        return $this->hasMany(Compra::class);
    }
}
