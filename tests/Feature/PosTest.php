<?php

use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Puc;
use App\Models\StockBodega;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('pos.view');
    Permission::findOrCreate('pos.create');
});

test('the POS page lists every sellable producto, including out-of-stock ones', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $conStock = Producto::factory()->create(['inventariable' => true, 'categoria' => 'LLANTA']);
    Producto::factory()->create(['inventariable' => true, 'categoria' => 'LLANTA']);
    Producto::factory()->create(['inventariable' => true, 'categoria' => 'SERVICIO']);

    StockBodega::create([
        'bodega_id' => Bodega::factory()->create()->id,
        'producto_id' => $conStock->id,
        'stock_inicial' => 0,
        'entradas' => 7,
        'salidas' => 0,
        'stock' => 7,
    ]);

    $this->actingAs($owner)
        ->get(route('pos.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('pos/index')
            ->has('productos', 2)
            ->has('clientes')
            ->has('bodegas')
            ->has('vendedores')
            ->where('canCreateCliente', true)
        );
});

test('members without pos.view cannot open the POS', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)->get(route('pos.index'))->assertForbidden();
});

test('checking out from the POS creates the pedido, deducts stock and stays on the POS', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $cliente = Cliente::factory()->create();
    $vendedor = User::factory()->create();
    $bodega = Bodega::factory()->create();
    $producto = Producto::factory()->create(['costo_producto' => 60]);

    StockBodega::create([
        'bodega_id' => $bodega->id,
        'producto_id' => $producto->id,
        'stock_inicial' => 10,
        'entradas' => 0,
        'salidas' => 0,
        'stock' => 10,
    ]);

    $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => $cliente->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => $vendedor->id,
        'bodega_id' => $bodega->id,
        'tipo_precio' => 'DETAL',
        'descuento' => 10,
        'flete' => 5,
        'detalles' => [
            ['producto_id' => $producto->id, 'cantidad' => 2, 'precio_unitario' => 100],
        ],
    ])->assertRedirect(route('pos.index'));

    $pedido = Pedido::firstOrFail();

    expect((float) $pedido->total_a_pagar)->toBe(195.0);
    expect((float) StockBodega::firstOrFail()->stock)->toBe(8.0);
});

test('members without pos.create cannot check out from the POS', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');
    $member->givePermissionTo('pos.view');

    $this->actingAs($member)->post(route('pos.store'), [
        'cliente_id' => Cliente::factory()->create()->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => User::factory()->create()->id,
        'bodega_id' => Bodega::factory()->create()->id,
        'tipo_precio' => 'DETAL',
        'detalles' => [
            ['producto_id' => Producto::factory()->create()->id, 'cantidad' => 1, 'precio_unitario' => 100],
        ],
    ])->assertForbidden();

    expect(Pedido::count())->toBe(0);
});

test('each POS line can be sold from a different bodega and deducts that bodega', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $bodegaPedido = Bodega::factory()->create();
    $bodegaOtra = Bodega::factory()->create();
    $producto = Producto::factory()->create();

    foreach ([$bodegaPedido, $bodegaOtra] as $bodega) {
        StockBodega::create([
            'bodega_id' => $bodega->id,
            'producto_id' => $producto->id,
            'stock_inicial' => 10,
            'entradas' => 0,
            'salidas' => 0,
            'stock' => 10,
        ]);
    }

    $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => Cliente::factory()->create()->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => User::factory()->create()->id,
        'bodega_id' => $bodegaPedido->id,
        'tipo_precio' => 'DETAL',
        'detalles' => [
            ['producto_id' => $producto->id, 'bodega_id' => $bodegaOtra->id, 'cantidad' => 3, 'precio_unitario' => 100],
            ['producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 100],
        ],
    ])->assertRedirect(route('pos.index'));

    $detalles = Pedido::firstOrFail()->detalles()->orderBy('id')->get();

    expect($detalles->pluck('bodega_id')->all())->toBe([$bodegaOtra->id, $bodegaPedido->id]);
    expect((float) StockBodega::where('bodega_id', $bodegaOtra->id)->value('stock'))->toBe(7.0);
    expect((float) StockBodega::where('bodega_id', $bodegaPedido->id)->value('stock'))->toBe(9.0);
});

test('the POS catalog exposes the stock of every bodega', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $producto = Producto::factory()->create(['inventariable' => true, 'categoria' => 'LLANTA']);
    $bodega = Bodega::factory()->create();

    StockBodega::create([
        'bodega_id' => $bodega->id,
        'producto_id' => $producto->id,
        'stock_inicial' => 0,
        'entradas' => 4,
        'salidas' => 0,
        'stock' => 4,
    ]);

    $this->actingAs($owner)
        ->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page
            ->where('productos.0.stock_total', 4)
            ->where("productos.0.stock_por_bodega.{$bodega->id}", 4)
        );
});

test('the POS stores placa, aplica_turno and facturacion_electronica on the pedido', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => Cliente::factory()->create()->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => User::factory()->create()->id,
        'bodega_id' => Bodega::factory()->create()->id,
        'tipo_precio' => 'DETAL',
        'placa' => 'ABC123',
        'aplica_turno' => '1',
        'facturacion_electronica' => '1',
        'detalles' => [
            ['producto_id' => Producto::factory()->create()->id, 'cantidad' => 1, 'precio_unitario' => 100],
        ],
    ])->assertRedirect(route('pos.index'));

    $pedido = Pedido::firstOrFail();

    expect($pedido->placa)->toBe('ABC123');
    expect((bool) $pedido->aplica_turno)->toBeTrue();
    expect($pedido->facturacion_electronica)->toBeTrue();
});

test('checking out with abonos registers the payments and updates the pedido balance', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $puc = Puc::factory()->create();

    $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => Cliente::factory()->create()->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => User::factory()->create()->id,
        'bodega_id' => Bodega::factory()->create()->id,
        'tipo_precio' => 'DETAL',
        'tipo_pago' => 'APARTADO',
        'reteica' => 5,
        'retefuente' => 5,
        'detalles' => [
            ['producto_id' => Producto::factory()->create()->id, 'cantidad' => 2, 'precio_unitario' => 100],
        ],
        'abonos' => [
            ['puc_id' => $puc->id, 'monto' => 60, 'con_cuanto_pago' => 100],
        ],
    ])->assertRedirect(route('pos.index'));

    $pedido = Pedido::firstOrFail();
    $abono = $pedido->abonos()->firstOrFail();

    expect($pedido->tipo_pago)->toBe('APARTADO');
    expect((float) $pedido->total_a_pagar)->toBe(190.0);
    expect((float) $pedido->abono)->toBe(60.0);
    expect((float) $pedido->saldo_pendiente)->toBe(130.0);
    expect($pedido->estado_pago)->toBe('EN_CARTERA');
    expect((float) $abono->cambio)->toBe(40.0);
});

test('an abono needs a valid payment method', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => Cliente::factory()->create()->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => User::factory()->create()->id,
        'bodega_id' => Bodega::factory()->create()->id,
        'tipo_precio' => 'DETAL',
        'detalles' => [
            ['producto_id' => Producto::factory()->create()->id, 'cantidad' => 1, 'precio_unitario' => 100],
        ],
        'abonos' => [['monto' => 50]],
    ])->assertSessionHasErrors('abonos.0.puc_id');

    expect(Pedido::count())->toBe(0);
});

test('the cliente order history is filtered by date range and scoped to the cliente', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $cliente = Cliente::factory()->create();
    $vendedor = User::factory()->create();
    $bodega = Bodega::factory()->create();

    $crear = fn (Cliente $c, string $fecha) => $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => $c->id,
        'fecha' => $fecha,
        'user_id' => $vendedor->id,
        'bodega_id' => $bodega->id,
        'tipo_precio' => 'DETAL',
        'detalles' => [
            ['producto_id' => Producto::factory()->create()->id, 'cantidad' => 1, 'precio_unitario' => 100],
        ],
    ]);

    $crear($cliente, '2026-01-10 10:00:00');
    $crear($cliente, '2026-03-10 10:00:00');
    $crear(Cliente::factory()->create(), '2026-01-11 10:00:00');

    $this->actingAs($owner)
        ->getJson(route('pos.clientes.pedidos', [$cliente]))
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $this->actingAs($owner)
        ->getJson(route('pos.clientes.pedidos', [$cliente, 'desde' => '2026-02-01', 'hasta' => '2026-03-31']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.productos.0', fn ($producto) => str_starts_with($producto, '1 x '));
});

test('members without pos.view cannot read a cliente order history', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)
        ->getJson(route('pos.clientes.pedidos', [Cliente::factory()->create()]))
        ->assertForbidden();
});

test('the POS saves the observacion_pago built from the abono descriptions', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => Cliente::factory()->create()->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => User::factory()->create()->id,
        'bodega_id' => Bodega::factory()->create()->id,
        'tipo_precio' => 'DETAL',
        'observacion_pago' => "- Transferencia Bancolombia\n- Efectivo",
        'detalles' => [
            ['producto_id' => Producto::factory()->create()->id, 'cantidad' => 1, 'precio_unitario' => 100],
        ],
    ])->assertRedirect(route('pos.index'));

    expect(Pedido::firstOrFail()->observacion_pago)->toBe("- Transferencia Bancolombia\n- Efectivo");
});

test('the POS history lists every pedido and filters by vendedor and date', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $vendedorA = User::factory()->create();
    $vendedorB = User::factory()->create();
    $bodega = Bodega::factory()->create();

    $crear = fn (User $vendedor, string $fecha) => $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => Cliente::factory()->create()->id,
        'fecha' => $fecha,
        'user_id' => $vendedor->id,
        'bodega_id' => $bodega->id,
        'tipo_precio' => 'DETAL',
        'detalles' => [
            ['producto_id' => Producto::factory()->create()->id, 'cantidad' => 1, 'precio_unitario' => 100],
        ],
    ]);

    $crear($vendedorA, '2026-01-10 10:00:00');
    $crear($vendedorA, '2026-03-10 10:00:00');
    $crear($vendedorB, '2026-03-11 10:00:00');

    $this->actingAs($owner)
        ->getJson(route('pos.pedidos'))
        ->assertOk()
        ->assertJsonCount(3, 'data');

    $this->actingAs($owner)
        ->getJson(route('pos.pedidos', ['user_id' => $vendedorA->id]))
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.vendedor', $vendedorA->name);

    $this->actingAs($owner)
        ->getJson(route('pos.pedidos', ['user_id' => $vendedorA->id, 'desde' => '2026-02-01']))
        ->assertJsonCount(1, 'data');
});

test('members without pos.view cannot read the POS history', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)->getJson(route('pos.pedidos'))->assertForbidden();
});

test('the POS exposes the marcas and whether the user can create productos', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)
        ->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page
            ->has('marcas')
            ->where('canCreateProducto', true)
        );
});

test('the turno is generated from the bodega name and the pedido number of the day', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $outlet = Bodega::factory()->create(['nombre_bodega' => 'Outlet Norte']);
    $otra = Bodega::factory()->create(['nombre_bodega' => 'ECONOMIC']);
    $cliente = Cliente::factory()->create();
    $vendedor = User::factory()->create();

    $vender = fn (Bodega $bodega, string $fecha, bool $turno = true) => $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => $cliente->id,
        'fecha' => $fecha,
        'user_id' => $vendedor->id,
        'bodega_id' => $bodega->id,
        'tipo_precio' => 'DETAL',
        'aplica_turno' => $turno ? '1' : '0',
        'detalles' => [
            ['producto_id' => Producto::factory()->create()->id, 'cantidad' => 1, 'precio_unitario' => 100],
        ],
    ]);

    $vender($outlet, '2026-03-10T15:00:00Z');
    $vender($outlet, '2026-03-10T16:00:00Z');
    $vender($outlet, '2026-03-10T17:00:00Z', turno: false);
    $vender($otra, '2026-03-10T16:00:00Z');
    $vender($outlet, '2026-03-11T15:00:00Z');

    expect(Pedido::orderBy('id')->pluck('turno')->all())->toBe(['OUT-0001', 'OUT-0002', null, 'ECO-0001', 'OUT-0001']);
});

test('checking out flashes the voucher data with the turno, totals and cliente', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $bodega = Bodega::factory()->create(['nombre_bodega' => 'Outlet Norte']);
    $cliente = Cliente::factory()->create(['razon_social' => 'Cecilia Gonzalez']);
    $producto = Producto::factory()->create(['concatenar_codigo_nombre' => '100/80-17-HEVOS']);

    $response = $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => $cliente->id,
        'fecha' => '2026-03-10T15:00:00Z',
        'user_id' => User::factory()->create(['name' => 'SuperAdmin'])->id,
        'bodega_id' => $bodega->id,
        'tipo_precio' => 'DETAL',
        'aplica_turno' => '1',
        'placa' => 'BTM568',
        'detalles' => [
            ['producto_id' => $producto->id, 'cantidad' => 4, 'precio_unitario' => 83000],
        ],
    ]);

    $voucher = session('inertia.flash_data')['pedido_creado'] ?? null;

    $response->assertRedirect(route('pos.index'));
    expect($voucher)->not->toBeNull()
        ->and($voucher['pedido']['turno'])->toBe('OUT-0001')
        ->and($voucher['pedido']['total_a_pagar'])->toBe(332000.0)
        ->and($voucher['pedido']['placa'])->toBe('BTM568')
        ->and($voucher['vendedor'])->toBe('SuperAdmin')
        ->and($voucher['cliente']['razon_social'])->toBe('Cecilia Gonzalez')
        ->and($voucher['detalles'][0]['nombre'])->toBe('100/80-17-HEVOS')
        ->and($voucher['detalles'][0]['cantidad'])->toBe(4.0);
});

test('the POS history date filter uses the Bogota day, not UTC', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $crear = fn (string $fecha) => $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => Cliente::factory()->create()->id,
        'fecha' => $fecha,
        'user_id' => User::factory()->create()->id,
        'bodega_id' => Bodega::factory()->create()->id,
        'tipo_precio' => 'DETAL',
        'detalles' => [
            ['producto_id' => Producto::factory()->create()->id, 'cantidad' => 1, 'precio_unitario' => 100],
        ],
    ]);

    // 10 pm on Mar 10 in Bogota is already Mar 11 in UTC.
    $crear('2026-03-11T03:00:00Z');
    // 8 am on Mar 11 in Bogota.
    $crear('2026-03-11T13:00:00Z');

    $this->actingAs($owner)
        ->getJson(route('pos.pedidos', ['desde' => '2026-03-10', 'hasta' => '2026-03-10']))
        ->assertJsonCount(1, 'data');

    $this->actingAs($owner)
        ->getJson(route('pos.pedidos', ['desde' => '2026-03-11', 'hasta' => '2026-03-11']))
        ->assertJsonCount(1, 'data');
});

test('a pedido voucher can be fetched again from the POS history', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->post(route('pos.store'), [
        'cliente_id' => Cliente::factory()->create(['razon_social' => 'Cecilia Gonzalez'])->id,
        'fecha' => '2026-03-10T15:00:00Z',
        'user_id' => User::factory()->create()->id,
        'bodega_id' => Bodega::factory()->create(['nombre_bodega' => 'Outlet Norte'])->id,
        'tipo_precio' => 'DETAL',
        'aplica_turno' => '1',
        'detalles' => [
            ['producto_id' => Producto::factory()->create()->id, 'cantidad' => 2, 'precio_unitario' => 100],
        ],
    ]);

    $pedido = Pedido::firstOrFail();

    $this->actingAs($owner)
        ->getJson(route('pos.pedidos.voucher', [$pedido]))
        ->assertOk()
        ->assertJsonPath('pedido.id', $pedido->id)
        ->assertJsonPath('pedido.turno', 'OUT-0001')
        ->assertJsonPath('cliente.razon_social', 'Cecilia Gonzalez')
        ->assertJsonPath('detalles.0.cantidad', 2);
});

test('members without pos.view cannot fetch a voucher', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)
        ->getJson(route('pos.pedidos.voucher', [Pedido::factory()->create()]))
        ->assertForbidden();
});

test('the sidebar badges count all the pedidos and compras the user can see', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    Pedido::factory()->create(['tipo_precio' => 'DETAL', 'estado' => 'PENDIENTE']);
    Pedido::factory()->create(['tipo_precio' => 'DETAL', 'estado' => 'COMPLETADO']);
    Pedido::factory()->count(2)->create(['tipo_precio' => 'MAYORISTA', 'estado' => 'PENDIENTE']);

    $this->actingAs($owner)
        ->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page
            ->where('navCounts.pedidos', 2)
            ->where('navCounts.pedidosMayoristas', 2)
            ->where('navCounts.compras', 0)
        );

    $member = User::factory()->create();
    asignarRol($member, 'Member');
    $member->givePermissionTo('pos.view');

    $this->actingAs($member)
        ->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page
            ->where('navCounts.pedidos', 0)
            ->where('navCounts.pedidosMayoristas', 0)
        );
});
