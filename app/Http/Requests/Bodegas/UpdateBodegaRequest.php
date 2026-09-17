<?php

namespace App\Http\Requests\Bodegas;

use App\Models\Bodega;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBodegaRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $bodega = $this->route('bodega');

        abort_if(! $bodega instanceof Bodega, 404);

        return [
            'nombre_bodega' => ['required', 'string', 'max:255', Rule::unique('bodegas', 'nombre_bodega')->ignore($bodega->id)],
            'ubicacion_bodega' => ['nullable', 'string', 'max:255'],
        ];
    }
}
