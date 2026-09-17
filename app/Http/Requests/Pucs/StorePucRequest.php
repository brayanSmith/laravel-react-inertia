<?php

namespace App\Http\Requests\Pucs;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePucRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tipo' => ['required', Rule::in(['1', '2', '3', '4', '5', '6', '7', '8', '9'])],
            'cuenta' => ['required', 'string', 'max:255'],
            'subcuenta' => ['required', 'string', 'max:255', 'unique:pucs,subcuenta'],
            'concepto' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:255'],
        ];
    }
}
