<?php

namespace App\Models;

use App\Models\Concerns\LogsCambios;
use Database\Factories\EmpresaFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Empresa extends Model
{
    /** @use HasFactory<EmpresaFactory> */
    use HasFactory;

    use LogsCambios;

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

    /**
     * @return list<string>
     */
    protected function logCampos(): array
    {
        return ['nombre_empresa', 'direccion_empresa', 'telefono_empresa', 'email_empresa', 'nit_empresa'];
    }

    /**
     * @return array{0: string, 1: bool}
     */
    protected function logEtiqueta(): array
    {
        return ['Empresa', true];
    }
}
