<?php

namespace App\Http\Requests\Pucs;

use App\Models\Puc;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePucRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $puc = $this->route('puc');

        abort_if(! $puc instanceof Puc, 404);

        return [
            'tipo' => ['required', Rule::in(['1', '2', '3', '4', '5', '6', '7', '8', '9'])],
            'cuenta' => ['required', 'string', 'max:255'],
            'subcuenta' => ['required', 'string', 'max:255', Rule::unique('pucs', 'subcuenta')->ignore($puc->id)],
            'concepto' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:255'],
        ];
    }
}
