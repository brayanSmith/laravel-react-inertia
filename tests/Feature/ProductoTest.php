<?php

use App\Models\Marca;
use App\Models\Producto;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('productos.view');
    Permission::findOrCreate('productos.create');
    Permission::findOrCreate('productos.update');
    Permission::findOrCreate('productos.delete');
});

test('owners can view, create, update and delete productos without a custom role', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');
    $marca = Marca::factory()->create(['marca' => 'WANDA']);

    $this->actingAs($owner)->get(route('productos.index', $team))->assertOk();
    $this->actingAs($owner)->get(route('productos.create', $team))->assertOk();

    $response = $this->actingAs($owner)->post(route('productos.store', $team), [
        'categoria' => 'LLANTA',
        'tipo' => 'NUEVO',
        'inventariable' => true,
        'ancho' => '155',
        'construccion' => 'R',
        'rin' => '13',
        'tipo_vehiculo' => 'CARRO',
        'marca_id' => $marca->id,
        'referencia_producto' => '155R13',
        'descripcion_producto' => '8PR/WR082/90/88N',
        'costo_producto' => 115000,
        'valor_detal' => 150000,
        'valor_mayorista' => 130000,
    ]);

    $response->assertRedirect(route('productos.index', $team));

    $producto = Producto::firstOrFail();
    expect($producto->concatenar_codigo_nombre)->toBe('155R13-WANDA-8PR/WR082/90/88N');

    $this->actingAs($owner)->get(route('productos.show', [$team, $producto]))->assertOk();
    $this->actingAs($owner)->get(route('productos.edit', [$team, $producto]))->assertOk();

    $this->actingAs($owner)->patch(route('productos.update', [$team, $producto]), [
        'categoria' => 'LLANTA',
        'tipo' => 'NUEVO',
        'ancho' => '155',
        'construccion' => 'R',
        'rin' => '13',
        'tipo_vehiculo' => 'CARRO',
        'marca_id' => $marca->id,
        'referencia_producto' => '155R13',
        'descripcion_producto' => 'Actualizada',
    ])->assertRedirect(route('productos.index', $team));

    expect($producto->fresh()->descripcion_producto)->toBe('Actualizada');
    expect($producto->fresh()->concatenar_codigo_nombre)->toBe('155R13-WANDA-Actualizada');

    $this->actingAs($owner)->delete(route('productos.destroy', [$team, $producto]))
        ->assertRedirect(route('productos.index', $team));

    expect(Producto::withTrashed()->find($producto->id)->trashed())->toBeTrue();
});

test('members without permission cannot view productos', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');

    $this->actingAs($member)->get(route('productos.index', $team))->assertForbidden();
});

test('sku must be unique when provided', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    Producto::factory()->create(['sku' => '12345678']);

    $this->actingAs($owner)->post(route('productos.store', $team), [
        'categoria' => 'OTRO',
        'tipo' => 'NUEVO',
        'sku' => '12345678',
    ])->assertSessionHasErrors('sku');
});
