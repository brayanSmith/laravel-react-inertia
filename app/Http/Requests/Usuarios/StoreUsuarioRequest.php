<?php

namespace App\Http\Requests\Usuarios;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreUsuarioRequest extends FormRequest
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {

        return [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'tipos_precio_permitidos' => ['required', 'array', 'min:1'],
            'tipos_precio_permitidos.*' => ['string', 'in:valor_detal,valor_mayorista,costo'],
            'roles' => ['array'],
            'roles.*' => ['integer', 'exists:roles,id'],
        ];
    }
}
