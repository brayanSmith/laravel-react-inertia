<?php

use App\Models\Cliente;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    Permission::findOrCreate('clientes.view');
    Permission::findOrCreate('clientes.create');
    Permission::findOrCreate('clientes.update');
    Permission::findOrCreate('clientes.delete');
});

test('owners can view, create, update and delete clientes without a custom role', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');
    $owner->switchTeam($team);

    $this->actingAs($owner)->get(route('clientes.index'))->assertOk();

    $this->actingAs($owner)->post(route('clientes.store'), [
        'tipo_documento' => 'CC',
        'numero_documento' => '1234567890',
        'razon_social' => 'Cliente de prueba',
        'retenedor_fuente' => 'NO',
    ])->assertRedirect();

    $cliente = Cliente::firstOrFail();

    $this->actingAs($owner)->patch(route('clientes.update', $cliente), [
        'tipo_documento' => 'CC',
        'numero_documento' => '1234567890',
        'razon_social' => 'Cliente actualizado',
        'retenedor_fuente' => 'NO',
    ])->assertRedirect();

    expect($cliente->fresh()->razon_social)->toBe('Cliente actualizado');

    $this->actingAs($owner)->delete(route('clientes.destroy', $cliente))->assertRedirect();

    expect(Cliente::withTrashed()->find($cliente->id)->trashed())->toBeTrue();
});

test('members without a role cannot view clientes', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');
    $member->switchTeam($team);

    $this->actingAs($member)->get(route('clientes.index'))->assertForbidden();
});

test('members with a role granting clientes.view can see the list but not create', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');
    $member->switchTeam($team);

    app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
    $role = Role::create(['name' => 'Vendedor', 'team_id' => $team->id]);
    $role->syncPermissions(['clientes.view']);
    $member->syncRoles([$role]);

    $this->actingAs($member)->get(route('clientes.index'))->assertOk();

    $this->actingAs($member)->post(route('clientes.store'), [
        'tipo_documento' => 'CC',
        'numero_documento' => '1234567890',
        'razon_social' => 'Cliente de prueba',
        'retenedor_fuente' => 'NO',
    ])->assertForbidden();
});
