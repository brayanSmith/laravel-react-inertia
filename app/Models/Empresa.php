<?php

namespace App\Models;

use Database\Factories\EmpresaFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Empresa extends Model
{
    /** @use HasFactory<EmpresaFactory> */
    use HasFactory;

    protected $appends = [
        'logo_empresa_url',
    ];

    protected $fillable = [
        'nombre_empresa',
        'direccion_empresa',
        'telefono_empresa',
        'email_empresa',
        'nit_empresa',
        'logo_empresa',
    ];

    /**
     * @return Attribute<string|null, never>
     */
    protected function logoEmpresaUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->logo_empresa ? Storage::disk('public')->url($this->logo_empresa) : null,
        );
    }
}
