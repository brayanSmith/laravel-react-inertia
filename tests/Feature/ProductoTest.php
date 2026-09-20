<?php

use App\Models\Cliente;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\DetallePedido;
use App\Models\Marca;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Proveedor;
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

test('the detalles endpoint returns paginated pedido and compra history for a producto', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    $producto = Producto::factory()->create();
    $otroProducto = Producto::factory()->create();

    $cliente = Cliente::factory()->create(['razon_social' => 'Cliente Uno']);
    $pedido = Pedido::factory()->create(['cliente_id' => $cliente->id]);
    DetallePedido::factory()->create(['producto_id' => $producto->id, 'pedido_id' => $pedido->id]);
    DetallePedido::factory()->create(['producto_id' => $otroProducto->id]);

    $proveedor = Proveedor::factory()->create(['nombre_proveedor' => 'Proveedor Uno']);
    $compra = Compra::factory()->create(['proveedor_id' => $proveedor->id]);
    DetalleCompra::factory()->create(['producto_id' => $producto->id, 'compra_id' => $compra->id]);
    DetalleCompra::factory()->create(['producto_id' => $otroProducto->id]);

    $response = $this->actingAs($owner)->getJson(route('productos.detalles', [$team, $producto]));

    $response->assertOk();
    $response->assertJsonCount(1, 'detallePedidos.data');
    $response->assertJsonCount(1, 'detalleCompras.data');
    $response->assertJsonPath('detallePedidos.data.0.pedido.cliente.razon_social', 'Cliente Uno');
    $response->assertJsonPath('detalleCompras.data.0.compra.proveedor.nombre_proveedor', 'Proveedor Uno');
});

test('members without permission cannot view producto detalles', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');
    $producto = Producto::factory()->create();

    $this->actingAs($member)->getJson(route('productos.detalles', [$team, $producto]))->assertForbidden();
});

test('creating a producto from another screen can keep the user there', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    $payload = ['categoria' => 'OTRO', 'tipo' => 'NUEVO', 'referencia_producto' => 'X-1'];

    $this->actingAs($owner)->from(route('pos.index', $team))
        ->post(route('productos.store', $team), $payload + ['stay_on_page' => '1'])
        ->assertRedirect(route('pos.index', $team));

    $this->actingAs($owner)
        ->post(route('productos.store', $team), ['referencia_producto' => 'X-2'] + $payload)
        ->assertRedirect(route('productos.index', $team));
});
