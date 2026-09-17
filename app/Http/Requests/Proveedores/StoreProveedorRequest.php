<?php

namespace App\Http\Requests\Proveedores;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProveedorRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre_proveedor' => ['required', 'string', 'max:255'],
            'razon_social_proveedor' => ['nullable', 'string', 'max:255'],
            'nit_proveedor' => ['required', 'string', 'max:255', 'unique:proveedors,nit_proveedor'],
            'rut_proveedor_imagen' => ['nullable', 'image', 'max:4096'],
            'tipo_proveedor' => ['required', Rule::in(['REMISIONADO', 'ELECTRONICO'])],
            'categoria_proveedor' => ['required', Rule::in(['DECLARANTE', 'NO_DECLARANTE', 'RETENEDOR'])],
            'departamento_proveedor' => ['nullable', 'string', 'max:255'],
            'ciudad_proveedor' => ['nullable', 'string', 'max:255'],
            'direccion_proveedor' => ['nullable', 'string', 'max:255'],
            'telefono_proveedor' => ['nullable', 'string', 'max:255'],
            'banco_proveedor' => ['nullable', 'string', 'max:255'],
            'tipo_cuenta_proveedor' => ['nullable', Rule::in(['AHORRO', 'CORRIENTE'])],
            'numero_cuenta_proveedor' => ['nullable', 'string', 'max:255'],
            'convenio' => ['nullable', 'string', 'max:255'],
            'tiempo_respuesta' => ['nullable', 'string', 'max:255'],
            'fabricante' => ['nullable', 'string', 'max:255'],
            'flete' => ['boolean'],
            'valor_flete' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
