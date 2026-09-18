<?php

namespace App\Http\Requests\Productos;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductoRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'categoria' => ['required', Rule::in(['LLANTA', 'RIN', 'SERVICIO', 'OTRO'])],
            'tipo' => ['required', Rule::in(['NUEVO', 'USADO'])],
            'inventariable' => ['boolean'],
            'ancho' => ['nullable', 'string', 'max:255'],
            'perfil' => ['nullable', 'string', 'max:255'],
            'construccion' => ['nullable', 'string', 'max:255'],
            'rin' => ['nullable', 'string', 'max:255'],
            'tipo_vehiculo' => ['nullable', Rule::in(['MOTO', 'CARRO'])],
            'diametro' => ['nullable', 'string', 'max:255'],
            'marca_id' => ['nullable', 'integer', 'exists:marcas,id'],
            'referencia_producto' => ['nullable', 'string', 'max:255'],
            'descripcion_producto' => ['nullable', 'string', 'max:255'],
            'costo_producto' => ['nullable', 'numeric', 'min:0'],
            'valor_detal' => ['nullable', 'numeric', 'min:0'],
            'valor_mayorista' => ['nullable', 'numeric', 'min:0'],
            'valor_sin_instalacion' => ['nullable', 'numeric', 'min:0'],
            'imagen_producto' => ['nullable', 'image', 'max:4096'],
            'sku' => ['nullable', 'string', 'max:255', 'unique:productos,sku'],
        ];
    }
}
