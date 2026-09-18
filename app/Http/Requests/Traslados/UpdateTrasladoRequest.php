<?php

namespace App\Http\Requests\Traslados;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTrasladoRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'bodega_donante_id' => ['required', 'integer', 'exists:bodegas,id'],
            'bodega_destino_id' => ['required', 'integer', 'exists:bodegas,id', 'different:bodega_donante_id'],
            'producto_id' => ['required', 'integer', 'exists:productos,id'],
            'cantidad' => ['required', 'integer', 'min:1'],
            'observaciones' => ['nullable', 'string'],
        ];
    }
}
