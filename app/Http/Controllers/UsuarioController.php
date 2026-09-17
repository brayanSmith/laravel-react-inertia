<?php

namespace App\Http\Controllers;

use App\Enums\TeamRole;
use App\Http\Requests\Usuarios\StoreUsuarioRequest;
use App\Http\Requests\Usuarios\UpdateUsuarioRequest;
use App\Models\Membership;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UsuarioController extends Controller
{
    /**
     * Display a listing of the team's staff users.
     */
    public function index(Request $request, string $current_team): Response
    {
        Gate::authorize('usuarios.view');

        $team = Team::where('slug', $current_team)->firstOrFail();

        $usuarios = $team->members()->get()->map(function (User $member) {
            /** @var Membership $membership */
            $membership = $member->getRelation('pivot');

            return [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'team_role' => $membership->role->value,
                'team_role_label' => $membership->role->label(),
                'roles' => $member->roles->pluck('id')->values(),
                'is_owner' => $membership->role === TeamRole::Owner,
            ];
        });

        return Inertia::render('usuarios/index', [
            'team' => ['slug' => $team->slug],
            'usuarios' => $usuarios,
            'availableTeamRoles' => TeamRole::assignable(),
            'availableRoles' => Role::where('team_id', $team->id)->orderBy('name')->get(['id', 'name']),
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

            $team->memberships()->create([
                'user_id' => $usuario->id,
                'role' => TeamRole::from($request->validated('team_role')),
            ]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

            $roles = Role::where('team_id', $team->id)
                ->whereIn('id', $request->validated('roles', []))
                ->get();

            $usuario->syncRoles($roles);
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

        $membership = $team->memberships()->where('user_id', $usuario->id)->firstOrFail();

        abort_if($membership->role === TeamRole::Owner, 403, __('The team owner cannot be edited here.'));

        DB::transaction(function () use ($request, $team, $usuario, $membership) {
            $data = [
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
            ];

            if ($password = $request->validated('password')) {
                $data['password'] = $password;
            }

            $usuario->update($data);

            $membership->update(['role' => TeamRole::from($request->validated('team_role'))]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

            $roles = Role::where('team_id', $team->id)
                ->whereIn('id', $request->validated('roles', []))
                ->get();

            $usuario->syncRoles($roles);
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
            app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
            $usuario->syncRoles([]);

            $team->memberships()->where('user_id', $usuario->id)->delete();
        });

        if ($usuario->isCurrentTeam($team)) {
            $usuario->switchTeam($usuario->personalTeam());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Usuario removed.')]);

        return back();
    }
}
