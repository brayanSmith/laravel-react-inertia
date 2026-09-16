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
        /** @var Cliente $cliente */
        $cliente = $this->route('cliente');

        return [
            'nombre' => ['required', 'string', 'max:255'],
            'apellido' => ['required', 'string', 'max:255'],
            'n_documento' => ['required', 'string', 'max:255', Rule::unique('clientes', 'n_documento')->ignore($cliente->id)],
            'direccion' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('clientes', 'email')->ignore($cliente->id)],
            'telefono' => ['nullable', 'string', 'max:255'],
        ];
    }
}
