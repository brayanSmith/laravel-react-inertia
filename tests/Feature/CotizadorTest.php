<?php

use App\Models\Producto;
use App\Models\StockBodega;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('cotizador.view');
    Permission::findOrCreate('pedidos.view');
    Permission::findOrCreate('pedidos-mayoristas.view');
});

test('the cotizador only lists productos with stock and the expected fields', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $enStock = Producto::factory()->create([
        'referencia_producto' => '100/80-17',
        'valor_detal' => 150000,
        'valor_mayorista' => 130000,
    ]);
    StockBodega::factory()->create([
        'producto_id' => $enStock->id,
        'stock_inicial' => 0,
        'entradas' => 5,
        'salidas' => 0,
        'stock' => 5,
    ]);

    $sinStock = Producto::factory()->create();
    StockBodega::factory()->create([
        'producto_id' => $sinStock->id,
        'stock_inicial' => 0,
        'entradas' => 0,
        'salidas' => 0,
        'stock' => 0,
    ]);

    $response = $this->actingAs($owner)->get(route('cotizador.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('cotizador/index')
        ->has('productos', 1)
        ->where('productos.0.id', $enStock->id)
        ->where('productos.0.stock_total', 5)
    );
});

test('members without permission cannot view the cotizador', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)->get(route('cotizador.index'))->assertForbidden();
});

test('the price type is locked to the module the user can view', function () {

    $detalOnly = User::factory()->create();
    asignarRol($detalOnly, 'Member');
    $detalOnly->givePermissionTo(['cotizador.view', 'pedidos.view']);

    $this->actingAs($detalOnly)
        ->get(route('cotizador.index'))
        ->assertInertia(fn ($page) => $page->where('tipoPrecioRestringido', 'DETAL'));

    $mayoristaOnly = User::factory()->create();
    asignarRol($mayoristaOnly, 'Member');
    $mayoristaOnly->givePermissionTo(['cotizador.view', 'pedidos-mayoristas.view']);

    $this->actingAs($mayoristaOnly)
        ->get(route('cotizador.index'))
        ->assertInertia(fn ($page) => $page->where('tipoPrecioRestringido', 'MAYORISTA'));
});

test('a user who can view both pedido modules gets the free choice', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)
        ->get(route('cotizador.index'))
        ->assertInertia(fn ($page) => $page->where('tipoPrecioRestringido', null));
});
