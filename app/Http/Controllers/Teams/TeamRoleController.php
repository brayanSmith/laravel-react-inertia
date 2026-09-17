<?php

namespace App\Http\Controllers\Teams;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\SaveTeamRoleRequest;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class TeamRoleController extends Controller
{
    /**
     * Display the team's custom roles and permissions.
     */
    public function index(Team $team): Response
    {
        Gate::authorize('update', $team);

        $roles = Role::where('team_id', $team->id)
            ->with('permissions')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->values(),
            ]);

        return Inertia::render('teams/roles/index', [
            'team' => [
                'slug' => $team->slug,
                'name' => $team->name,
            ],
            'roles' => $roles,
            'permissions' => Permission::orderBy('name')->pluck('name'),
            'members' => $team->members()->get()->map(fn (User $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'roles' => $member->roles->pluck('id')->values(),
            ]),
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(SaveTeamRoleRequest $request, Team $team): RedirectResponse
    {
        Gate::authorize('update', $team);

        $role = Role::create([
            'name' => $request->validated('name'),
            'team_id' => $team->id,
        ]);

        $role->syncPermissions($request->validated('permissions', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role created.')]);

        return to_route('teams.roles.index', ['team' => $team->slug]);
    }

    /**
     * Update the specified role.
     */
    public function update(SaveTeamRoleRequest $request, Team $team, Role $role): RedirectResponse
    {
        Gate::authorize('update', $team);

        abort_unless($role->getAttribute('team_id') === $team->id, 404);

        $role->update(['name' => $request->validated('name')]);
        $role->syncPermissions($request->validated('permissions', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role updated.')]);

        return to_route('teams.roles.index', ['team' => $team->slug]);
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Team $team, Role $role): RedirectResponse
    {
        Gate::authorize('update', $team);

        abort_unless($role->getAttribute('team_id') === $team->id, 404);

        $role->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role deleted.')]);

        return to_route('teams.roles.index', ['team' => $team->slug]);
    }
}
