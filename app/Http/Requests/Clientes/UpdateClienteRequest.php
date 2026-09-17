<?php

namespace App\Http\Requests\Clientes;

use App\Models\Cliente;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClienteRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $cliente = $this->route('cliente');

        abort_if(! $cliente instanceof Cliente, 404);

        return [
            'tipo_documento' => ['required', 'string', Rule::in(['CC', 'NIT', 'CE', 'TI', 'PASAPORTE'])],
            'numero_documento' => ['required', 'string', 'max:255', Rule::unique('clientes', 'numero_documento')->ignore($cliente->id)],
            'razon_social' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'ciudad' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('clientes', 'email')->ignore($cliente->id)],
            'activo' => ['boolean'],
            'novedad' => ['nullable', 'string', 'max:255'],
            'rut_imagen' => ['nullable', 'image', 'max:4096'],
            'remove_rut_imagen' => ['boolean'],
            'retenedor_fuente' => ['required', Rule::in(['SI', 'NO'])],
        ];
    }
}
