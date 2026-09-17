<?php

namespace App\Support;

use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Manages the three built-in team tiers (Owner/Admin/Member) as Spatie roles
 * scoped per team, replacing the former App\Enums\TeamRole system.
 */
class TeamRoles
{
    /**
     * The built-in team tier role names, in order of privilege (highest first).
     *
     * @var array<int, string>
     */
    public const TIERS = ['Owner', 'Admin', 'Member'];

    /**
     * All team-management permissions (dot-notation), owned entirely by the Owner tier.
     *
     * @var array<int, string>
     */
    public const TEAM_PERMISSIONS = [
        'team.update',
        'team.delete',
        'team.member.add',
        'team.member.update',
        'team.member.remove',
        'team.invitation.create',
        'team.invitation.cancel',
    ];

    /**
     * Team-management permissions granted to the Admin tier by default.
     *
     * @var array<int, string>
     */
    protected const ADMIN_TEAM_PERMISSIONS = [
        'team.update',
        'team.invitation.create',
        'team.invitation.cancel',
    ];

    /**
     * Create (if missing) the team's Owner/Admin/Member roles and (re)sync their permissions.
     *
     * Ensures the team.* permissions exist first, so this can safely run before
     * (or without) the app's permission catalog seeder having run.
     */
    public static function provisionDefaultRoles(Team $team): void
    {
        foreach (self::TEAM_PERMISSIONS as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        Role::firstOrCreate([
            'team_id' => $team->id,
            'name' => 'Owner',
            'guard_name' => 'web',
        ])->syncPermissions(Permission::pluck('name')->all());

        Role::firstOrCreate([
            'team_id' => $team->id,
            'name' => 'Admin',
            'guard_name' => 'web',
        ])->syncPermissions(self::ADMIN_TEAM_PERMISSIONS);

        Role::firstOrCreate([
            'team_id' => $team->id,
            'name' => 'Member',
            'guard_name' => 'web',
        ]);
    }

    /**
     * Get one of the team's built-in tier roles by name.
     */
    public static function role(Team $team, string $tier): ?Role
    {
        return Role::where('team_id', $team->id)
            ->where('name', $tier)
            ->where('guard_name', 'web')
            ->first();
    }

    /**
     * Get the user's current tier role (Owner/Admin/Member) on the team, if any.
     */
    public static function tierRole(User $user, Team $team): ?Role
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        return $user->roles()
            ->where('roles.team_id', $team->id)
            ->whereIn('roles.name', self::TIERS)
            ->first();
    }

    /**
     * Assign a tier role to the user, replacing any tier role they already had on the team.
     */
    public static function assignTier(User $user, Team $team, string $tier): void
    {
        $role = self::role($team, $tier);

        abort_if($role === null, 404, "Unknown team role tier [{$tier}].");

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $user->roles()
            ->where('roles.team_id', $team->id)
            ->whereIn('roles.name', self::TIERS)
            ->get()
            ->each(fn (Role $existing) => $user->removeRole($existing));

        $user->assignRole($role);
    }

    /**
     * Remove all of the user's roles (tier and custom) for the team.
     */
    public static function clearAllRoles(User $user, Team $team): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $user->roles()
            ->where('roles.team_id', $team->id)
            ->get()
            ->each(fn (Role $role) => $user->removeRole($role));
    }

    /**
     * The tier roles that can be assigned to a member (excludes Owner), Admin first.
     *
     * @return Collection<int, Role>
     */
    public static function assignableTierRoles(Team $team): Collection
    {
        $order = ['Admin' => 0, 'Member' => 1];

        return Role::where('team_id', $team->id)
            ->whereIn('name', ['Admin', 'Member'])
            ->get()
            ->sortBy(fn (Role $role) => $order[$role->name] ?? 99)
            ->values();
    }

    /**
     * Format tier roles as {value, label} options for the frontend.
     *
     * @param  Collection<int, Role>  $roles
     * @return array<int, array{value: string, label: string}>
     */
    public static function toRoleOptions(Collection $roles): array
    {
        return $roles->map(fn (Role $role) => [
            'value' => strtolower($role->name),
            'label' => $role->name,
        ])->values()->all();
    }

    /**
     * Query the team's custom (non-tier) roles.
     */
    public static function customRolesQuery(Team $team)
    {
        return Role::where('team_id', $team->id)->whereNotIn('name', self::TIERS);
    }

    /**
     * Sync the user's custom (non-tier) roles for the team, leaving their tier role untouched.
     *
     * @param  Collection<int, Role>  $roles
     */
    public static function syncCustomRoles(User $user, Team $team, Collection $roles): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $roles = $roles->reject(fn (Role $role) => in_array($role->name, self::TIERS, true));

        $user->roles()
            ->where('roles.team_id', $team->id)
            ->whereNotIn('roles.name', self::TIERS)
            ->get()
            ->each(fn (Role $existing) => $user->removeRole($existing));

        $roles->each(fn (Role $role) => $user->assignRole($role));
    }
}
