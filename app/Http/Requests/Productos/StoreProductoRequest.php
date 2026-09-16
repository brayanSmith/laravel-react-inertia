<?php

namespace App\Http\Requests\Productos;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

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
            'codigo' => ['required', 'string', 'max:255', 'unique:productos,codigo'],
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'costo' => ['required', 'numeric', 'min:0'],
            'precio_detal' => ['required', 'numeric', 'min:0'],
            'precio_mayorista' => ['required', 'numeric', 'min:0'],
            'precio_especial' => ['required', 'numeric', 'min:0'],
            'imagen' => ['nullable', File::image()->max(5 * 1024)],
        ];
    }
}
