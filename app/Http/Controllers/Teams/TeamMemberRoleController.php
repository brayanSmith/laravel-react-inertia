<?php

namespace App\Http\Controllers\Teams;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\UpdateMemberRolesRequest;
use App\Models\Team;
use App\Models\User;
use App\Support\TeamRoles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class TeamMemberRoleController extends Controller
{
    /**
     * Update the specified member's custom roles.
     */
    public function update(UpdateMemberRolesRequest $request, Team $team, User $user): RedirectResponse
    {
        Gate::authorize('update', $team);

        abort_unless($user->belongsToTeam($team), 404);

        $roles = TeamRoles::customRolesQuery($team)
            ->whereIn('id', $request->validated('roles', []))
            ->get();

        TeamRoles::syncCustomRoles($user, $team, $roles);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member roles updated.')]);

        return to_route('teams.roles.index', ['team' => $team->slug]);
    }
}
