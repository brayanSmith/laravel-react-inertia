<?php

use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('pedidos.view');
    Permission::findOrCreate('pedidos.create');
    Permission::findOrCreate('pedidos-mayoristas.view');
    Permission::findOrCreate('pedidos-mayoristas.create');
});

test('the pedidos index only lists DETAL pedidos and the mayoristas index only lists MAYORISTA ones', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $cliente = Cliente::factory()->create();
    $vendedor = User::factory()->create();
    $producto = Producto::factory()->create();
    $bodega = Bodega::factory()->create();

    $this->actingAs($owner)->post(route('pedidos.store'), [
        'cliente_id' => $cliente->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => $vendedor->id,
        'bodega_id' => $bodega->id,
        'tipo_precio' => 'DETAL',
        'detalles' => [
            ['producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 100],
        ],
    ])->assertRedirect(route('pedidos.index'));

    $this->actingAs($owner)->post(route('pedidos-mayoristas.store'), [
        'cliente_id' => $cliente->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => $vendedor->id,
        'bodega_id' => $bodega->id,
        'tipo_precio' => 'MAYORISTA',
        'detalles' => [
            ['producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 80],
        ],
    ])->assertRedirect(route('pedidos-mayoristas.index'));

    expect(Pedido::count())->toBe(2);

    $detalPedido = Pedido::where('tipo_precio', 'DETAL')->firstOrFail();
    $mayoristaPedido = Pedido::where('tipo_precio', 'MAYORISTA')->firstOrFail();

    $pedidosIndex = $this->actingAs($owner)->get(route('pedidos.index'));
    $pedidosIndex->assertOk();
    $pedidosIndex->assertInertia(fn ($page) => $page
        ->has('pedidos', 1)
        ->where('pedidos.0.id', $detalPedido->id)
    );

    $mayoristasIndex = $this->actingAs($owner)->get(route('pedidos-mayoristas.index'));
    $mayoristasIndex->assertOk();
    $mayoristasIndex->assertInertia(fn ($page) => $page
        ->has('pedidos', 1)
        ->where('pedidos.0.id', $mayoristaPedido->id)
    );
});

test('creating from the mayoristas module defaults tipo_precio to MAYORISTA on the create page', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)
        ->get(route('pedidos-mayoristas.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('defaultTipoPrecio', 'MAYORISTA'));
});

test('pedidos-mayoristas permission is independent from pedidos permission', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');
    $member->givePermissionTo('pedidos.view');

    $this->actingAs($member)->get(route('pedidos.index'))->assertOk();
    $this->actingAs($member)->get(route('pedidos-mayoristas.index'))->assertForbidden();
});
