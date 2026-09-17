<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

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

    protected $appends = [
        'rut_imagen_url',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function pedidos()
    {
        return $this->hasMany(Pedido::class);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function rutImagenUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->rut_imagen ? Storage::disk('public')->url($this->rut_imagen) : null,
        );
    }
}
