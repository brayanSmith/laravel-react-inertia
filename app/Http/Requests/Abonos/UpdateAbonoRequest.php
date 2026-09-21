<?php

namespace App\Http\Requests\Abonos;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAbonoRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'puc_id' => ['required', 'integer', 'exists:pucs,id'],
            'monto' => ['required', 'numeric', 'min:0.01'],
            'con_cuanto_pago' => ['nullable', 'numeric', 'min:0.01'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'fecha' => ['nullable', 'date'],
            'vendedor_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
