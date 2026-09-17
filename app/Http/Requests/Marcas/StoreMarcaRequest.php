<?php

namespace App\Http\Requests\Marcas;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreMarcaRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'marca' => ['required', 'string', 'max:255', 'unique:marcas,marca'],
            'descripcion_marca' => ['nullable', 'string', 'max:255'],
        ];
    }
}
