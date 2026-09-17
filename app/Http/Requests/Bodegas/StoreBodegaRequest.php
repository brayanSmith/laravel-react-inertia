<?php

namespace App\Http\Requests\Bodegas;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBodegaRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre_bodega' => ['required', 'string', 'max:255', 'unique:bodegas,nombre_bodega'],
            'ubicacion_bodega' => ['nullable', 'string', 'max:255'],
        ];
    }
}
