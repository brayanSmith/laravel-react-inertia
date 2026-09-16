<?php

namespace App\Http\Requests\Productos;

use App\Models\Producto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class UpdateProductoRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Producto $producto */
        $producto = $this->route('producto');

        return [
            'codigo' => ['required', 'string', 'max:255', Rule::unique('productos', 'codigo')->ignore($producto->id)],
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'costo' => ['required', 'numeric', 'min:0'],
            'precio_detal' => ['required', 'numeric', 'min:0'],
            'precio_mayorista' => ['required', 'numeric', 'min:0'],
            'precio_especial' => ['required', 'numeric', 'min:0'],
            'imagen' => ['nullable', File::image()->max(5 * 1024)],
            'remove_imagen' => ['nullable', 'boolean'],
        ];
    }
}
