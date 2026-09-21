<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('usuarios.view');
    Permission::findOrCreate('usuarios.create');
    Permission::findOrCreate('usuarios.update');
    Permission::findOrCreate('usuarios.delete');
});

test('owners can create a user with roles', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');
    $role = Role::create(['name' => 'Vendedor']);

    $this
        ->actingAs($owner)
        ->post(route('usuarios.store'), [
            'name' => 'Nuevo Empleado',
            'email' => 'empleado@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [$role->id],
        ])
        ->assertRedirect();

    $usuario = User::where('email', 'empleado@example.com')->firstOrFail();

    expect($usuario->hasRole('Vendedor'))->toBeTrue();
    expect(Hash::check('password123', $usuario->password))->toBeTrue();
    expect($usuario->email_verified_at)->not->toBeNull();
});

test('members without permission cannot create users', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this
        ->actingAs($member)
        ->post(route('usuarios.store'), [
            'name' => 'Nuevo Empleado',
            'email' => 'empleado@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertForbidden();
});

test('a user can be edited and its roles replaced', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');
    $empleado = User::factory()->create();
    $vendedor = Role::create(['name' => 'Vendedor']);
    $cajero = Role::create(['name' => 'Cajero']);
    $empleado->assignRole($vendedor);

    $this->actingAs($owner)->patch(route('usuarios.update', [$empleado]), [
        'name' => 'Otro Nombre',
        'email' => $empleado->email,
        'roles' => [$cajero->id],
    ])->assertRedirect();

    expect($empleado->fresh()->name)->toBe('Otro Nombre');
    expect($empleado->fresh()->roles->pluck('name')->all())->toBe(['Cajero']);
});

test('nobody can delete their own user', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->delete(route('usuarios.destroy', [$owner]))->assertForbidden();
    expect(User::find($owner->id))->not->toBeNull();
});

test('deleting a user removes the account', function () {
    $owner = User::factory()->create();
    $empleado = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->delete(route('usuarios.destroy', [$empleado]))->assertRedirect();

    expect(User::find($empleado->id))->toBeNull();
});
