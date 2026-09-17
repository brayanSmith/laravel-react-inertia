<?php

namespace App\Http\Requests\Marcas;

use App\Models\Marca;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMarcaRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $marca = $this->route('marca');

        abort_if(! $marca instanceof Marca, 404);

        return [
            'marca' => ['required', 'string', 'max:255', Rule::unique('marcas', 'marca')->ignore($marca->id)],
            'descripcion_marca' => ['nullable', 'string', 'max:255'],
        ];
    }
}
