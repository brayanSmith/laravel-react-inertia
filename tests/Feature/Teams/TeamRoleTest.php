<?php

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    Permission::findOrCreate('clientes.view');
    Permission::findOrCreate('clientes.create');
});

test('owners can create a custom role with permissions', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);

    $response = $this
        ->actingAs($owner)
        ->post(route('teams.roles.store', $team), [
            'name' => 'Vendedor',
            'permissions' => ['clientes.view', 'clientes.create'],
        ]);

    $response->assertRedirect(route('teams.roles.index', $team));

    $role = Role::where('team_id', $team->id)->where('name', 'Vendedor')->first();

    expect($role)->not->toBeNull();
    expect($role->permissions->pluck('name')->all())->toEqualCanonicalizing(['clientes.view', 'clientes.create']);
});

test('members cannot create a custom role', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);

    $response = $this
        ->actingAs($member)
        ->post(route('teams.roles.store', $team), [
            'name' => 'Vendedor',
            'permissions' => [],
        ]);

    $response->assertForbidden();
});

test('a role from another team cannot be updated', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    $otherTeam = Team::factory()->create();
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);
    $otherTeam->members()->attach($owner, ['role' => TeamRole::Owner->value]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($otherTeam->id);
    $roleInOtherTeam = Role::create(['name' => 'Vendedor', 'team_id' => $otherTeam->id]);

    $response = $this
        ->actingAs($owner)
        ->patch(route('teams.roles.update', [$team, $roleInOtherTeam]), [
            'name' => 'Vendedor renombrado',
            'permissions' => [],
        ]);

    $response->assertNotFound();
});

test('assigning a role grants its permissions to the member within that team', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    $role = Role::create(['name' => 'Vendedor', 'team_id' => $team->id]);
    $role->syncPermissions(['clientes.view']);

    $response = $this
        ->actingAs($owner)
        ->patch(route('teams.members.roles.update', [$team, $member]), [
            'roles' => [$role->id],
        ]);

    $response->assertRedirect(route('teams.roles.index', $team));

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    expect($member->fresh()->can('clientes.view'))->toBeTrue();
    expect($member->fresh()->can('clientes.create'))->toBeFalse();
});

test('member permissions do not carry over to a different team', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $team = Team::factory()->create();
    $otherTeam = Team::factory()->create();
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);
    $otherTeam->members()->attach($member, ['role' => TeamRole::Member->value]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    $role = Role::create(['name' => 'Vendedor', 'team_id' => $team->id]);
    $role->syncPermissions(['clientes.view']);
    $member->syncRoles([$role]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($otherTeam->id);
    expect($member->fresh()->can('clientes.view'))->toBeFalse();
});

test('deleting a role removes it from members who had it', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    $role = Role::create(['name' => 'Vendedor', 'team_id' => $team->id]);
    $member->syncRoles([$role]);

    $response = $this
        ->actingAs($owner)
        ->delete(route('teams.roles.destroy', [$team, $role]));

    $response->assertRedirect(route('teams.roles.index', $team));

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    expect($member->fresh()->roles()->count())->toBe(0);
});
