<?php

namespace App\Models;

use Database\Factories\ProveedorFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Proveedor extends Model
{
    /** @use HasFactory<ProveedorFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $appends = [
        'rut_proveedor_imagen_url',
    ];

    protected $casts = [
        'flete' => 'boolean',
        'valor_flete' => 'decimal:2',
    ];

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
        'valor_flete',
    ];

    public function compras()
    {
        return $this->hasMany(Compra::class);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function rutProveedorImagenUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->rut_proveedor_imagen ? Storage::disk('public')->url($this->rut_proveedor_imagen) : null,
        );
    }
}
