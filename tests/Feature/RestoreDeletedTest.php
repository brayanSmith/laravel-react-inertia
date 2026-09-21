<?php

use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\DetallePedido;
use App\Models\Gasto;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\StockBodega;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    foreach (['clientes', 'proveedores', 'gastos', 'compras', 'pedidos', 'pedidos-mayoristas', 'productos'] as $recurso) {
        foreach (['view', 'delete'] as $accion) {
            Permission::findOrCreate("{$recurso}.{$accion}");
        }
    }

    $this->owner = User::factory()->create();
    $this->team = Team::factory()->create();
    attachTeamMember($this->team, $this->owner, 'Owner');
});

dataset('modulos simples', [
    'clientes' => ['clientes', 'clientes', fn () => Cliente::factory()->create()],
    'proveedores' => ['proveedores', 'proveedores', fn () => Proveedor::factory()->create()],
    'gastos' => ['gastos', 'gastos', fn () => Gasto::factory()->create()],
    'productos' => ['productos', 'productos', fn () => Producto::factory()->create()],
]);

test('the deleted records can be listed and restored', function (string $ruta, string $prop, Closure $crear) {
    $registro = $crear();
    $registro->delete();

    $this->actingAs($this->owner)->get(route("{$ruta}.index", $this->team))
        ->assertInertia(fn ($page) => $page->has($prop, 0)->where('eliminados', false));

    $this->actingAs($this->owner)->get(route("{$ruta}.index", [$this->team, 'eliminados' => 1]))
        ->assertInertia(fn ($page) => $page->has($prop, 1)->where('eliminados', true));

    $this->actingAs($this->owner)
        ->patch(route("{$ruta}.restore", [$this->team, $registro->id]))
        ->assertRedirect();

    expect($registro->fresh()->trashed())->toBeFalse();

    $this->actingAs($this->owner)->get(route("{$ruta}.index", $this->team))
        ->assertInertia(fn ($page) => $page->has($prop, 1));
})->with('modulos simples');

test('restoring needs the delete permission', function (string $ruta, string $prop, Closure $crear) {
    $registro = $crear();
    $registro->delete();

    $miembro = User::factory()->create();
    attachTeamMember($this->team, $miembro, 'Member');
    $miembro->givePermissionTo("{$ruta}.view");

    $this->actingAs($miembro)
        ->patch(route("{$ruta}.restore", [$this->team, $registro->id]))
        ->assertForbidden();

    expect($registro->fresh()->trashed())->toBeTrue();

    // Without the delete permission the deleted list is not offered either.
    $this->actingAs($miembro)->get(route("{$ruta}.index", [$this->team, 'eliminados' => 1]))
        ->assertInertia(fn ($page) => $page->where('eliminados', false));
})->with('modulos simples');

test('a deleted pedido keeps its lines, and restoring it takes the stock out again', function () {
    $bodega = Bodega::factory()->create();
    $producto = Producto::factory()->create();
    StockBodega::create(['bodega_id' => $bodega->id, 'producto_id' => $producto->id, 'stock_inicial' => 10, 'entradas' => 0, 'salidas' => 0, 'stock' => 10]);

    $this->actingAs($this->owner)->post(route('pedidos.store', $this->team), [
        'cliente_id' => Cliente::factory()->create()->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => User::factory()->create()->id,
        'bodega_id' => $bodega->id,
        'tipo_precio' => 'DETAL',
        'detalles' => [['producto_id' => $producto->id, 'cantidad' => 4, 'precio_unitario' => 100]],
    ]);

    $pedido = Pedido::firstOrFail();
    $stock = fn () => (float) StockBodega::firstOrFail()->stock;
    expect($stock())->toBe(6.0);

    $this->actingAs($this->owner)->delete(route('pedidos.destroy', [$this->team, $pedido]));

    expect($stock())->toBe(10.0);
    expect(DetallePedido::withTrashed()->where('pedido_id', $pedido->id)->count())->toBe(1);
    expect($pedido->fresh()->detalles)->toHaveCount(0);

    $this->actingAs($this->owner)->get(route('pedidos.index', [$this->team, 'eliminados' => 1]))
        ->assertInertia(fn ($page) => $page
            ->has('pedidos', 1)
            ->where('pedidos.0.detalles.0.producto_id', $producto->id)
        );

    $this->actingAs($this->owner)->patch(route('pedidos.restore', [$this->team, $pedido->id]))->assertRedirect();

    expect($stock())->toBe(6.0);
    expect(Pedido::find($pedido->id)->detalles)->toHaveCount(1);
});

test('a deleted mayorista pedido is restored through its own module', function () {
    $pedido = Pedido::factory()->create(['tipo_precio' => 'MAYORISTA']);
    $pedido->delete();

    $this->actingAs($this->owner)
        ->patch(route('pedidos-mayoristas.restore', [$this->team, $pedido->id]))
        ->assertRedirect();

    expect($pedido->fresh()->trashed())->toBeFalse();
});

test('editing a pedido replaces its lines for good instead of piling up deleted ones', function () {
    $bodega = Bodega::factory()->create();
    $producto = Producto::factory()->create();
    $pedido = Pedido::factory()->create(['bodega_id' => $bodega->id]);
    DetallePedido::factory()->create(['pedido_id' => $pedido->id, 'producto_id' => $producto->id]);

    $this->actingAs($this->owner)->patch(route('pedidos.update', [$this->team, $pedido]), [
        'cliente_id' => $pedido->cliente_id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => $pedido->user_id,
        'bodega_id' => $bodega->id,
        'tipo_precio' => 'DETAL',
        'detalles' => [['producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 50]],
    ]);

    expect(DetallePedido::withTrashed()->where('pedido_id', $pedido->id)->count())->toBe(1);
});

test('a deleted compra keeps its lines, and restoring it receives the stock again', function () {
    $bodega = Bodega::factory()->create();
    $producto = Producto::factory()->create();
    $proveedor = Proveedor::factory()->create();

    $this->actingAs($this->owner)->post(route('compras.store', $this->team), [
        'factura' => 'F-1',
        'proveedor_id' => $proveedor->id,
        'fecha' => '2026-01-10 10:00:00',
        'detalles' => [['producto_id' => $producto->id, 'bodega_id' => $bodega->id, 'cantidad' => 5, 'precio_unitario' => 10, 'recibido' => true]],
    ])->assertRedirect();

    $compra = Compra::firstOrFail();
    $stock = fn () => (float) StockBodega::firstOrFail()->stock;
    expect($stock())->toBe(5.0);

    $this->actingAs($this->owner)->delete(route('compras.destroy', [$this->team, $compra]));

    expect($stock())->toBe(0.0);
    expect(DetalleCompra::withTrashed()->where('compra_id', $compra->id)->count())->toBe(1);

    $this->actingAs($this->owner)->get(route('compras.index', [$this->team, 'eliminados' => 1]))
        ->assertInertia(fn ($page) => $page->has('compras', 1)->has('compras.0.detalles_compra', 1));

    $this->actingAs($this->owner)->patch(route('compras.restore', [$this->team, $compra->id]))->assertRedirect();

    expect($stock())->toBe(5.0);
    expect(Compra::find($compra->id)->detallesCompra)->toHaveCount(1);
});

test('deleted records are left out of the dashboard figures and back once restored', function () {
    $bodega = Bodega::factory()->create();
    $pedido = Pedido::factory()->create(['bodega_id' => $bodega->id, 'fecha' => '2026-03-02', 'total_a_pagar' => 500]);
    DetallePedido::factory()->create(['pedido_id' => $pedido->id, 'cantidad' => 2, 'subtotal' => 500]);

    $productos = fn () => $this->actingAs($this->owner)->get(route('dashboard', $this->team))->viewData('page')['props']['resumen']['productosVendidos']['cantidad'];

    expect($productos())->toBe(2);

    $this->actingAs($this->owner)->delete(route('pedidos.destroy', [$this->team, $pedido]));
    expect($productos())->toBe(0);

    $this->actingAs($this->owner)->patch(route('pedidos.restore', [$this->team, $pedido->id]));
    expect($productos())->toBe(2);
});
