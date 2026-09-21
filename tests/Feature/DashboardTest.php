<?php

use App\Models\Bodega;
use App\Models\DetalleCompra;
use App\Models\DetallePedido;
use App\Models\Gasto;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $user = User::factory()->create();
    asignarRol($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    asignarRol($user);

    $response = $this
        ->actingAs($user)
        ->get(route('dashboard'));

    $response->assertOk();
});

test('the dashboard counts units per bodega and tipo, grouping mayorista orders apart', function () {
    $user = User::factory()->create();
    asignarRol($user);
    $bodega = Bodega::factory()->create(['nombre_bodega' => 'Central']);

    $nuevo = Producto::factory()->create(['tipo' => 'NUEVO']);
    $servicio = Producto::factory()->create(['categoria' => 'SERVICIO', 'tipo' => 'SERVICIO']);

    $detal = Pedido::factory()->create(['bodega_id' => $bodega->id, 'tipo_precio' => 'DETAL']);
    $mayorista = Pedido::factory()->create(['bodega_id' => $bodega->id, 'tipo_precio' => 'MAYORISTA']);

    foreach ([[$detal, $nuevo, 3], [$detal, $servicio, 2], [$mayorista, $nuevo, 10]] as [$pedido, $producto, $cantidad]) {
        DetallePedido::factory()->create([
            'pedido_id' => $pedido->id,
            'producto_id' => $producto->id,
            'bodega_id' => $bodega->id,
            'cantidad' => $cantidad,
        ]);
    }

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('cantidadPorBodega.filas.0.almacen', 'Central')
            ->where('cantidadPorBodega.filas.0.NUEVO', 3)
            ->where('cantidadPorBodega.filas.0.SERVICIO', 2)
            ->where('cantidadPorBodega.filas.0.total', 5)
            ->where('cantidadPorBodega.filas.0.valores.total', fn ($valor) => $valor > 0)
            ->where('cantidadPorBodega.filas.1.almacen', 'Mayorista')
            ->where('cantidadPorBodega.filas.1.NUEVO', 10)
            ->where('cantidadPorBodega.totales.total', 15)
        );
});

test('the dashboard summarizes sales, investment, expenses, profit and adjustments', function () {
    $user = User::factory()->create();
    asignarRol($user);
    $bodega = Bodega::factory()->create();
    $producto = Producto::factory()->create();

    $pedido = Pedido::factory()->create([
        'bodega_id' => $bodega->id,
        'total_a_pagar' => 1000,
        'descuento' => 10,
        'reteica' => 5,
        'retefuente' => 7,
        'fecha' => now()->toDateString(),
    ]);
    DetallePedido::factory()->create([
        'pedido_id' => $pedido->id,
        'producto_id' => $producto->id,
        'cantidad' => 4,
        'subtotal' => 1200,
        'costo_total' => 600,
    ]);
    Gasto::factory()->create(['monto' => 150]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('resumen.productosVendidos.cantidad', 4)
            ->where('resumen.productosVendidos.valor', 1200)
            ->where('resumen.productosVendidos.serie.0.cantidad', 4)
            ->where('resumen.valorPedidos.valor', 1000)
            ->where('resumen.valorPedidos.cantidad', 1)
            ->where('resumen.inversion', 600)
            ->where('resumen.gastos', 150)
            ->where('resumen.ganancia', 250)
            ->where('resumen.ajustes.reteica', 5)
            ->where('resumen.ajustes.retefuente', 7)
            ->where('resumen.ajustes.descuento', 10)
        );
});

test('the dashboard filters narrow the widgets and the table, leaving expenses out of product filters', function () {
    $user = User::factory()->create();
    asignarRol($user);
    $central = Bodega::factory()->create(['nombre_bodega' => 'Central']);
    $norte = Bodega::factory()->create(['nombre_bodega' => 'Norte']);
    $carro = Producto::factory()->create(['tipo_vehiculo' => 'CARRO']);
    $moto = Producto::factory()->create(['tipo_vehiculo' => 'MOTO']);

    $venta = function (Bodega $bodega, Producto $producto, string $fecha, int $cantidad) {
        $pedido = Pedido::factory()->create(['bodega_id' => $bodega->id, 'fecha' => $fecha, 'total_a_pagar' => $cantidad * 100]);
        DetallePedido::factory()->create([
            'pedido_id' => $pedido->id,
            'producto_id' => $producto->id,
            'bodega_id' => $bodega->id,
            'cantidad' => $cantidad,
            'subtotal' => $cantidad * 100,
            'costo_total' => $cantidad * 60,
        ]);
    };

    $venta($central, $carro, '2026-03-10', 2);
    $venta($central, $moto, '2026-03-20', 3);
    $venta($norte, $carro, '2026-04-05', 5);
    Gasto::factory()->create(['bodega_id' => $central->id, 'monto' => 40, 'fecha_gasto' => '2026-03-15']);
    Gasto::factory()->create(['bodega_id' => $norte->id, 'monto' => 90, 'fecha_gasto' => '2026-04-05']);

    $this->actingAs($user)
        ->get(route('dashboard', ['bodega_ids' => [$central->id]]))
        ->assertInertia(fn ($page) => $page
            ->where('resumen.productosVendidos.cantidad', 5)
            ->where('resumen.gastos', 40)
            ->has('cantidadPorBodega.filas', 1)
        );

    $this->actingAs($user)
        ->get(route('dashboard', ['desde' => '2026-04-01', 'hasta' => '2026-04-30']))
        ->assertInertia(fn ($page) => $page
            ->where('resumen.productosVendidos.cantidad', 5)
            ->where('resumen.gastos', 90)
        );

    $this->actingAs($user)
        ->get(route('dashboard', ['tipo_vehiculo' => 'MOTO']))
        ->assertInertia(fn ($page) => $page
            ->where('resumen.productosVendidos.cantidad', 3)
            ->where('resumen.valorPedidos.valor', 300)
            ->where('resumen.gastos', 130)
        );

    $this->actingAs($user)
        ->get(route('dashboard', ['producto_ids' => [$carro->id, $moto->id]]))
        ->assertInertia(fn ($page) => $page
            ->where('resumen.productosVendidos.cantidad', 10)
            ->where('filtros.producto_ids', [(string) $carro->id, (string) $moto->id])
        );
});

test('the product filter only lists products that have orders or purchases', function () {
    $user = User::factory()->create();
    asignarRol($user);

    $vendido = Producto::factory()->create();
    $comprado = Producto::factory()->create();
    $sinMovimiento = Producto::factory()->create();

    DetallePedido::factory()->create(['pedido_id' => Pedido::factory()->create()->id, 'producto_id' => $vendido->id]);
    DetalleCompra::factory()->create(['producto_id' => $comprado->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->has('productosFiltro', 2)
            ->where('productosFiltro', fn ($productos) => collect($productos)->pluck('id')->sort()->values()->all() === [$vendido->id, $comprado->id]
                && ! collect($productos)->pluck('id')->contains($sinMovimiento->id))
        );
});

test('mayorista works as one more bodega in the filter', function () {
    $user = User::factory()->create();
    asignarRol($user);
    $central = Bodega::factory()->create(['nombre_bodega' => 'Central']);
    $producto = Producto::factory()->create();

    $detal = Pedido::factory()->create(['bodega_id' => $central->id, 'tipo_precio' => 'DETAL', 'total_a_pagar' => 100]);
    $mayorista = Pedido::factory()->create(['bodega_id' => $central->id, 'tipo_precio' => 'MAYORISTA', 'total_a_pagar' => 700]);
    DetallePedido::factory()->create(['pedido_id' => $detal->id, 'producto_id' => $producto->id, 'bodega_id' => $central->id, 'cantidad' => 1, 'subtotal' => 100]);
    DetallePedido::factory()->create(['pedido_id' => $mayorista->id, 'producto_id' => $producto->id, 'bodega_id' => $central->id, 'cantidad' => 7, 'subtotal' => 700]);
    Gasto::factory()->create(['bodega_id' => $central->id, 'monto' => 30]);

    $consultar = fn (array $bodegas) => $this->actingAs($user)
        ->get(route('dashboard', ['bodega_ids' => $bodegas]));

    $consultar(['mayorista'])->assertInertia(fn ($page) => $page
        ->has('cantidadPorBodega.filas', 1)
        ->where('cantidadPorBodega.filas.0.almacen', 'Mayorista')
        ->where('resumen.productosVendidos.cantidad', 7)
        ->where('resumen.valorPedidos.valor', 700)
        ->where('resumen.gastos', 0)
    );

    $consultar([(string) $central->id])->assertInertia(fn ($page) => $page
        ->has('cantidadPorBodega.filas', 1)
        ->where('cantidadPorBodega.filas.0.total', 1)
        ->where('resumen.productosVendidos.cantidad', 1)
        ->where('resumen.valorPedidos.valor', 100)
        ->where('resumen.gastos', 30)
    );

    $consultar([(string) $central->id, 'mayorista'])->assertInertia(fn ($page) => $page
        ->has('cantidadPorBodega.filas', 2)
        ->where('resumen.productosVendidos.cantidad', 8)
        ->where('resumen.valorPedidos.valor', 800)
    );
});

test('the dashboard feeds the charts with categories, best sellers and orders per date', function () {
    $user = User::factory()->create();
    asignarRol($user);
    $bodega = Bodega::factory()->create();

    $llanta = Producto::factory()->create(['categoria' => 'LLANTA', 'concatenar_codigo_nombre' => 'LLA-1 Llanta']);
    $rin = Producto::factory()->create(['categoria' => 'RIN', 'concatenar_codigo_nombre' => 'RIN-1 Rin']);

    $lunes = Pedido::factory()->create(['bodega_id' => $bodega->id, 'fecha' => '2026-03-02']);
    $martes = Pedido::factory()->create(['bodega_id' => $bodega->id, 'fecha' => '2026-03-03']);

    foreach ([[$lunes, $llanta, 5], [$lunes, $rin, 1], [$martes, $llanta, 2]] as [$pedido, $producto, $cantidad]) {
        DetallePedido::factory()->create(['pedido_id' => $pedido->id, 'producto_id' => $producto->id, 'cantidad' => $cantidad]);
    }

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('graficos.categorias.0.categoria', 'LLANTA')
            ->where('graficos.categorias.0.cantidad', 7)
            ->has('graficos.categorias.0.valor')
            ->where('graficos.categorias.1.categoria', 'RIN')
            ->where('graficos.categorias.1.cantidad', 1)
            ->where('graficos.topProductos.0.producto', 'LLA-1 Llanta')
            ->where('graficos.topProductos.0.cantidad', 7)
            ->has('graficos.topProductos.0.valor')
            ->has('graficos.topProductos', 2)
            ->where('graficos.pedidosPorFecha.0.fecha', '2026-03-02')
            ->where('graficos.pedidosPorFecha.0.pedidos', 1)
            ->where('graficos.pedidosPorFecha.1.fecha', '2026-03-03')
        );
});

test('the dashboard chart carries sales value, cost and expenses per date', function () {
    $user = User::factory()->create();
    asignarRol($user);
    $bodega = Bodega::factory()->create();
    $producto = Producto::factory()->create();

    $pedido = Pedido::factory()->create(['bodega_id' => $bodega->id, 'fecha' => '2026-03-02', 'total_a_pagar' => 500]);
    DetallePedido::factory()->create([
        'pedido_id' => $pedido->id,
        'producto_id' => $producto->id,
        'cantidad' => 2,
        'subtotal' => 550,
        'costo_total' => 300,
    ]);
    Gasto::factory()->create(['bodega_id' => $bodega->id, 'fecha_gasto' => '2026-03-02', 'monto' => 40]);
    Gasto::factory()->create(['bodega_id' => $bodega->id, 'fecha_gasto' => '2026-03-02', 'monto' => 10]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('graficos.pedidosPorFecha.0.valor', 500)
            ->where('graficos.pedidosPorFecha.0.inversion', 300)
            ->where('graficos.gastosPorFecha.0.fecha', '2026-03-02')
            ->where('graficos.gastosPorFecha.0.gastos', 50)
        );
});

test('the chart adds up to the same figures as the widgets', function () {
    $user = User::factory()->create();
    asignarRol($user);
    $bodega = Bodega::factory()->create();
    $producto = Producto::factory()->create();

    foreach (['2026-03-02' => 900, '2026-03-03' => 450] as $fecha => $total) {
        $pedido = Pedido::factory()->create([
            'bodega_id' => $bodega->id,
            'fecha' => $fecha,
            'total_a_pagar' => $total,
        ]);
        DetallePedido::factory()->create([
            'pedido_id' => $pedido->id,
            'producto_id' => $producto->id,
            'cantidad' => 1,
            'subtotal' => $total + 100,
            'costo_total' => 200,
        ]);
    }
    Gasto::factory()->create(['bodega_id' => $bodega->id, 'fecha_gasto' => '2026-03-03', 'monto' => 50]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(function ($page) {
            $props = $page->toArray()['props'];
            $dias = $props['graficos']['pedidosPorFecha'];
            $gastos = array_sum(array_column($props['graficos']['gastosPorFecha'], 'gastos'));

            $ganancia = array_sum(array_column($dias, 'valor'))
                - array_sum(array_column($dias, 'inversion'))
                - $gastos;

            expect((float) $ganancia)->toBe((float) $props['resumen']['ganancia']);
            expect((float) array_sum(array_column($dias, 'valor')))->toBe((float) $props['resumen']['valorPedidos']['valor']);
        });
});
