<?php

namespace App\Http\Requests\Clientes;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClienteRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tipo_documento' => ['required', 'string', Rule::in(['CC', 'NIT', 'CE', 'TI', 'PASAPORTE'])],
            'numero_documento' => ['required', 'string', 'max:255', 'unique:clientes,numero_documento'],
            'razon_social' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'ciudad' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:clientes,email'],
            'activo' => ['boolean'],
            'novedad' => ['nullable', 'string', 'max:255'],
            'rut_imagen' => ['nullable', 'image', 'max:4096'],
            'retenedor_fuente' => ['required', Rule::in(['SI', 'NO'])],
        ];
    }
}
