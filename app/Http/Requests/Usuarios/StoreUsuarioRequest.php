<?php

namespace App\Http\Requests\Usuarios;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\TeamRole;
use App\Models\Team;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $team = Team::where('slug', $this->route('current_team'))->firstOrFail();

        return [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'team_role' => ['required', 'string', Rule::in(array_column(TeamRole::assignable(), 'value'))],
            'roles' => ['array'],
            'roles.*' => ['integer', Rule::exists('roles', 'id')->where('team_id', $team->id)],
        ];
    }
}
