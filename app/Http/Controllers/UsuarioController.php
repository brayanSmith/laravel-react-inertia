<?php

namespace App\Http\Controllers;

use App\Http\Requests\Usuarios\StoreUsuarioRequest;
use App\Http\Requests\Usuarios\UpdateUsuarioRequest;
use App\Models\Team;
use App\Models\User;
use App\Support\TeamRoles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UsuarioController extends Controller
{
    /**
     * Display a listing of the team's staff users.
     */
    public function index(Request $request, string $current_team): Response
    {
        Gate::authorize('usuarios.view');

        $team = Team::where('slug', $current_team)->firstOrFail();

        $usuarios = $team->members()->get()->map(function (User $member) use ($team) {
            $tier = TeamRoles::tierRole($member, $team);

            return [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'team_role' => $tier ? strtolower($tier->name) : null,
                'team_role_label' => $tier?->name,
                'roles' => $member->roles->whereNotIn('name', TeamRoles::TIERS)->pluck('id')->values(),
                'is_owner' => $tier?->name === 'Owner',
            ];
        });

        return Inertia::render('usuarios/index', [
            'team' => ['slug' => $team->slug],
            'usuarios' => $usuarios,
            'availableTeamRoles' => TeamRoles::toRoleOptions(TeamRoles::assignableTierRoles($team)),
            'availableRoles' => TeamRoles::customRolesQuery($team)->orderBy('name')->get(['id', 'name']),
            'permissions' => [
                'canCreate' => $request->user()->can('usuarios.create'),
                'canUpdate' => $request->user()->can('usuarios.update'),
                'canDelete' => $request->user()->can('usuarios.delete'),
            ],
        ]);
    }

    /**
     * Create a new staff user and attach them to the current team.
     */
    public function store(StoreUsuarioRequest $request, string $current_team): RedirectResponse
    {
        Gate::authorize('usuarios.create');

        $team = Team::where('slug', $current_team)->firstOrFail();

        DB::transaction(function () use ($request, $team) {
            $usuario = User::create([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'password' => $request->validated('password'),
            ]);

            $usuario->forceFill(['email_verified_at' => now()])->save();

            $team->memberships()->create(['user_id' => $usuario->id]);

            TeamRoles::assignTier($usuario, $team, ucfirst($request->validated('team_role')));

            $roles = TeamRoles::customRolesQuery($team)
                ->whereIn('id', $request->validated('roles', []))
                ->get();

            TeamRoles::syncCustomRoles($usuario, $team, $roles);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Usuario created.')]);

        return back();
    }

    /**
     * Update the specified staff user.
     */
    public function update(UpdateUsuarioRequest $request, string $current_team, User $usuario): RedirectResponse
    {
        Gate::authorize('usuarios.update');

        $team = Team::where('slug', $current_team)->firstOrFail();

        abort_unless($usuario->belongsToTeam($team), 404);

        $tier = TeamRoles::tierRole($usuario, $team);

        abort_if($tier?->name === 'Owner', 403, __('The team owner cannot be edited here.'));

        DB::transaction(function () use ($request, $team, $usuario) {
            $data = [
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
            ];

            if ($password = $request->validated('password')) {
                $data['password'] = $password;
            }

            $usuario->update($data);

            TeamRoles::assignTier($usuario, $team, ucfirst($request->validated('team_role')));

            $roles = TeamRoles::customRolesQuery($team)
                ->whereIn('id', $request->validated('roles', []))
                ->get();

            TeamRoles::syncCustomRoles($usuario, $team, $roles);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Usuario updated.')]);

        return back();
    }

    /**
     * Remove the specified staff user from the current team.
     */
    public function destroy(string $current_team, User $usuario): RedirectResponse
    {
        Gate::authorize('usuarios.delete');

        $team = Team::where('slug', $current_team)->firstOrFail();

        abort_unless($usuario->belongsToTeam($team), 404);

        abort_if($team->owner()?->is($usuario), 403, __('The team owner cannot be removed.'));

        DB::transaction(function () use ($team, $usuario) {
            TeamRoles::clearAllRoles($usuario, $team);

            $team->memberships()->where('user_id', $usuario->id)->delete();
        });

        if ($usuario->isCurrentTeam($team)) {
            $usuario->switchTeam($usuario->personalTeam());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Usuario removed.')]);

        return back();
    }
}
