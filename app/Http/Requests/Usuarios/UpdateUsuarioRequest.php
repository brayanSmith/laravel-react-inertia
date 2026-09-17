<?php

namespace App\Http\Requests\Usuarios;

use App\Concerns\ProfileValidationRules;
use App\Models\Team;
use App\Models\User;
use App\Support\TeamRoles;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUsuarioRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $team = Team::where('slug', $this->route('current_team'))->firstOrFail();
        $usuario = $this->route('usuario');

        abort_if(! $usuario instanceof User, 404);

        return [
            ...$this->profileRules($usuario->id),
            'password' => ['nullable', 'string', Password::default(), 'confirmed'],
            'team_role' => ['required', 'string', Rule::in(TeamRoles::assignableTierRoles($team)->map(fn ($role) => strtolower($role->name))->all())],
            'roles' => ['array'],
            'roles.*' => ['integer', Rule::exists('roles', 'id')->where('team_id', $team->id)],
        ];
    }
}
