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
            'tipos_precio_permitidos' => ['valor_detal', 'costo'],
            'roles' => [$role->id],
        ])
        ->assertRedirect();

    $usuario = User::where('email', 'empleado@example.com')->firstOrFail();

    expect($usuario->hasRole('Vendedor'))->toBeTrue();
    expect($usuario->tiposPrecioPermitidos())->toBe(['valor_detal', 'costo']);
    expect(Hash::check('password123', $usuario->password))->toBeTrue();
    expect($usuario->email_verified_at)->not->toBeNull();
});

test('at least one price must stay allowed', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->post(route('usuarios.store'), [
        'name' => 'Nuevo',
        'email' => 'nuevo@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'tipos_precio_permitidos' => [],
    ])->assertSessionHasErrors('tipos_precio_permitidos');
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
            'tipos_precio_permitidos' => ['valor_detal'],
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
        'tipos_precio_permitidos' => ['valor_mayorista'],
        'roles' => [$cajero->id],
    ])->assertRedirect();

    expect($empleado->fresh()->name)->toBe('Otro Nombre');
    expect($empleado->fresh()->tiposPrecioPermitidos())->toBe(['valor_mayorista']);
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

test('the allowed prices can be changed inline, keeping at least one', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');
    $empleado = User::factory()->create();

    $this->actingAs($owner)->patch(route('usuarios.precios.update', [$empleado]), [
        'tipos_precio_permitidos' => ['valor_detal'],
    ])->assertRedirect();

    expect($empleado->fresh()->tiposPrecioPermitidos())->toBe(['valor_detal']);

    $this->actingAs($owner)->patch(route('usuarios.precios.update', [$empleado]), [
        'tipos_precio_permitidos' => [],
    ])->assertSessionHasErrors('tipos_precio_permitidos');

    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)->patch(route('usuarios.precios.update', [$empleado]), [
        'tipos_precio_permitidos' => ['costo'],
    ])->assertForbidden();
});
