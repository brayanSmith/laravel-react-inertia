<?php

use App\Models\Team;
use App\Models\User;
use App\Support\TeamRoles;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    Permission::findOrCreate('usuarios.view');
    Permission::findOrCreate('usuarios.create');
    Permission::findOrCreate('usuarios.update');
    Permission::findOrCreate('usuarios.delete');
});

test('owners can create a staff user with a team role and custom roles', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    $role = Role::create(['name' => 'Vendedor', 'team_id' => $team->id]);

    $response = $this
        ->actingAs($owner)
        ->post(route('usuarios.store', $team), [
            'name' => 'Nuevo Empleado',
            'email' => 'empleado@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'team_role' => 'member',
            'roles' => [$role->id],
        ]);

    $response->assertRedirect();

    $usuario = User::where('email', 'empleado@example.com')->firstOrFail();

    expect($usuario->belongsToTeam($team))->toBeTrue();
    expect(TeamRoles::tierRole($usuario, $team)?->name)->toBe('Member');

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    expect($usuario->hasRole('Vendedor'))->toBeTrue();

    expect(Hash::check('password123', $usuario->password))->toBeTrue();
    expect($usuario->email_verified_at)->not->toBeNull();
});

test('members without permission cannot create staff users', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');

    $response = $this
        ->actingAs($member)
        ->post(route('usuarios.store', $team), [
            'name' => 'Nuevo Empleado',
            'email' => 'empleado@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'team_role' => 'member',
        ]);

    $response->assertForbidden();
});

test('the team owner cannot be edited or removed from usuarios', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    $this->actingAs($owner)->patch(route('usuarios.update', [$team, $owner]), [
        'name' => $owner->name,
        'email' => $owner->email,
        'team_role' => 'admin',
    ])->assertForbidden();

    $this->actingAs($owner)->delete(route('usuarios.destroy', [$team, $owner]))
        ->assertForbidden();
});

test('removing a staff user detaches their custom roles but keeps the account', function () {
    $owner = User::factory()->create();
    $employee = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');
    attachTeamMember($team, $employee, 'Member');

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    $role = Role::create(['name' => 'Vendedor', 'team_id' => $team->id]);
    $employee->syncRoles([$role]);

    $this->actingAs($owner)->delete(route('usuarios.destroy', [$team, $employee]))
        ->assertRedirect();

    expect($employee->fresh()->belongsToTeam($team))->toBeFalse();
    expect(User::find($employee->id))->not->toBeNull();

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    expect($employee->fresh()->roles()->count())->toBe(0);
});
