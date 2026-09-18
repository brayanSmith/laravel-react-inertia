<?php

namespace App\Http\Requests\Pedidos;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePedidoRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cliente_id' => ['required', 'integer', 'exists:clientes,id'],
            'fecha' => ['required', 'date'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'bodega_id' => ['required', 'integer', 'exists:bodegas,id'],
            'tipo_precio' => ['required', 'string', 'in:DETAL,MAYORISTA,OTRO'],
            'placa' => ['nullable', 'string', 'max:255'],
            'facturacion_electronica' => ['nullable', 'boolean'],
            'observacion' => ['nullable', 'string'],
            'observacion_pago' => ['nullable', 'string'],
            'flete' => ['nullable', 'numeric', 'min:0'],
            'descuento' => ['nullable', 'numeric', 'min:0'],
            'reteica' => ['nullable', 'numeric', 'min:0'],
            'retefuente' => ['nullable', 'numeric', 'min:0'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.producto_id' => ['required', 'integer', 'exists:productos,id'],
            'detalles.*.cantidad' => ['required', 'numeric', 'min:0.01'],
            'detalles.*.precio_unitario' => ['required', 'numeric', 'min:0'],
        ];
    }
}
