<?php

use App\Models\Proveedor;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('proveedores.view');
    Permission::findOrCreate('proveedores.create');
    Permission::findOrCreate('proveedores.update');
    Permission::findOrCreate('proveedores.delete');
});

test('owners can view, create, update and delete proveedores without a custom role', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->get(route('proveedores.index'))->assertOk();

    $this->actingAs($owner)->post(route('proveedores.store'), [
        'nombre_proveedor' => 'Proveedor Uno',
        'nit_proveedor' => '900111222-1',
        'tipo_proveedor' => 'REMISIONADO',
        'categoria_proveedor' => 'NO_DECLARANTE',
    ])->assertRedirect();

    $proveedor = Proveedor::firstOrFail();

    $this->actingAs($owner)->patch(route('proveedores.update', [$proveedor]), [
        'nombre_proveedor' => 'Proveedor Actualizado',
        'nit_proveedor' => '900111222-1',
        'tipo_proveedor' => 'ELECTRONICO',
        'categoria_proveedor' => 'DECLARANTE',
    ])->assertRedirect();

    expect($proveedor->fresh()->nombre_proveedor)->toBe('Proveedor Actualizado');
    expect($proveedor->fresh()->tipo_proveedor)->toBe('ELECTRONICO');

    $this->actingAs($owner)->delete(route('proveedores.destroy', [$proveedor]))
        ->assertRedirect();

    expect(Proveedor::withTrashed()->find($proveedor->id)->trashed())->toBeTrue();
});

test('members without permission cannot view proveedores', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)->get(route('proveedores.index'))->assertForbidden();
});

test('nit_proveedor must be unique', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    Proveedor::factory()->create(['nit_proveedor' => '900000000-1']);

    $this->actingAs($owner)->post(route('proveedores.store'), [
        'nombre_proveedor' => 'Duplicado',
        'nit_proveedor' => '900000000-1',
        'tipo_proveedor' => 'REMISIONADO',
        'categoria_proveedor' => 'NO_DECLARANTE',
    ])->assertSessionHasErrors('nit_proveedor');
});
