<?php

use App\Models\Abono;
use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\DetallePedido;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Puc;
use App\Models\Role;
use App\Models\StockBodega;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    foreach ([
        'clientes.view', 'clientes.view-deleted', 'clientes.restore',
        'pedidos.view', 'pedidos.update', 'pedidos.update-datos', 'pedidos.create-detalle', 'pedidos.update-detalle', 'pedidos.delete-detalle',
        'pedidos.create-abono', 'pedidos.update-abono', 'pedidos.delete-abono',
        'pos.view', 'pos.view-all-pedidos', 'pos.create-cliente', 'pos.create-producto',
        'stock-bodegas.view', 'stock-bodegas.view-inversion',
    ] as $permiso) {
        Permission::findOrCreate($permiso);
    }
    $this->miembro = User::factory()->create();
    asignarRol($this->miembro, 'Member');
});

test('seeing the deleted records and restoring them are separate permissions', function () {
    $cliente = Cliente::factory()->create();
    $cliente->delete();
    concederPermisos($this->miembro, ['clientes.view', 'clientes.view-deleted']);

    $this->actingAs($this->miembro)->get(route('clientes.index', ['eliminados' => 1]))
        ->assertInertia(fn ($page) => $page
            ->where('eliminados', true)
            ->has('clientes', 1)
            ->where('permissions.canViewDeleted', true)
            ->where('permissions.canRestore', false)
        );

    $this->actingAs($this->miembro)->patch(route('clientes.restore', [$cliente->id]))->assertForbidden();

    concederPermisos($this->miembro, 'clientes.restore');
    $this->actingAs($this->miembro)->patch(route('clientes.restore', [$cliente->id]))->assertRedirect();
    expect($cliente->fresh()->trashed())->toBeFalse();
});

/**
 * A pedido with one line, and the form the edit page would send after
 * changing the cliente, the cantidad of that line and adding another product.
 *
 * @return array{0: Pedido, 1: array<string, mixed>, 2: Cliente, 3: Producto}
 */
function pedidoParaEditar(): array
{
    $bodega = Bodega::factory()->create();
    $existente = Producto::factory()->create();
    $nuevo = Producto::factory()->create();
    $pedido = Pedido::factory()->create(['bodega_id' => $bodega->id, 'tipo_precio' => 'DETAL', 'observacion' => 'antes']);
    DetallePedido::factory()->create(['pedido_id' => $pedido->id, 'producto_id' => $existente->id, 'cantidad' => 2, 'precio_unitario' => 100, 'subtotal' => 200]);
    $otroCliente = Cliente::factory()->create();

    $formulario = [
        'cliente_id' => $otroCliente->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => $pedido->user_id,
        'bodega_id' => $bodega->id,
        'tipo_precio' => 'DETAL',
        'observacion' => 'despues',
        'detalles' => [
            ['producto_id' => $existente->id, 'cantidad' => 5, 'precio_unitario' => 100],
            ['producto_id' => $nuevo->id, 'cantidad' => 1, 'precio_unitario' => 50],
        ],
    ];

    return [$pedido, $formulario, $otroCliente, $nuevo];
}

test('without the edit permissions only the observaciones change on a pedido', function () {
    [$pedido, $formulario] = pedidoParaEditar();
    $clienteOriginal = $pedido->cliente_id;
    concederPermisos($this->miembro, ['pedidos.view', 'pedidos.update']);

    $this->actingAs($this->miembro)->patch(route('pedidos.update', [$pedido]), $formulario)->assertRedirect();

    $pedido->refresh();
    expect($pedido->cliente_id)->toBe($clienteOriginal);
    expect($pedido->observacion)->toBe('despues');
    expect($pedido->detalles)->toHaveCount(1);
    expect((float) $pedido->detalles->first()->cantidad)->toBe(2.0);
});

test('each product permission lets through only its own kind of change', function () {
    [$pedido, $formulario, $otroCliente, $nuevo] = pedidoParaEditar();
    concederPermisos($this->miembro, ['pedidos.view', 'pedidos.update', 'pedidos.update-datos', 'pedidos.update-detalle']);

    $this->actingAs($this->miembro)->patch(route('pedidos.update', [$pedido]), $formulario)->assertRedirect();

    $pedido->refresh();
    expect($pedido->cliente_id)->toBe($otroCliente->id);
    expect($pedido->detalles)->toHaveCount(1);
    expect((float) $pedido->detalles->first()->cantidad)->toBe(5.0);

    concederPermisos($this->miembro, 'pedidos.create-detalle');
    $this->actingAs($this->miembro)->patch(route('pedidos.update', [$pedido]), $formulario)->assertRedirect();

    expect($pedido->fresh()->detalles->pluck('producto_id')->all())->toContain($nuevo->id);
});

test('a product left out of the form is only removed with the delete permission', function () {
    [$pedido, $formulario, , $nuevo] = pedidoParaEditar();
    $formulario['detalles'] = [['producto_id' => $nuevo->id, 'cantidad' => 1, 'precio_unitario' => 50]];
    concederPermisos($this->miembro, ['pedidos.view', 'pedidos.update', 'pedidos.create-detalle']);

    $this->actingAs($this->miembro)->patch(route('pedidos.update', [$pedido]), $formulario)->assertRedirect();
    expect($pedido->fresh()->detalles)->toHaveCount(2);

    concederPermisos($this->miembro, 'pedidos.delete-detalle');
    $this->actingAs($this->miembro)->patch(route('pedidos.update', [$pedido]), $formulario)->assertRedirect();
    expect($pedido->fresh()->detalles->pluck('producto_id')->all())->toBe([$nuevo->id]);
});

test('the edit page tells the form what the user may do', function () {
    $pedido = Pedido::factory()->create();
    concederPermisos($this->miembro, ['pedidos.view', 'pedidos.update', 'pedidos.create-abono', 'pedidos.update-datos']);

    $this->actingAs($this->miembro)->get(route('pedidos.edit', [$pedido]))
        ->assertInertia(fn ($page) => $page
            ->where('permissions.canCreateAbono', true)
            ->where('permissions.canUpdateAbono', false)
            ->where('permissions.canDeleteAbono', false)
            ->where('permissions.canUpdateDatos', true)
            ->where('permissions.canCreateDetalle', false)
            ->where('permissions.canDeleteDetalle', false)
        );
});

test('registering, editing and deleting abonos are separate permissions', function () {
    $pedido = Pedido::factory()->create(['total_a_pagar' => 1000]);
    $puc = Puc::factory()->create();
    $datos = ['puc_id' => $puc->id, 'monto' => 100];
    concederPermisos($this->miembro, ['pedidos.view', 'pedidos.update']);

    $this->actingAs($this->miembro)->post(route('pedidos.abonos.store', [$pedido]), $datos)->assertForbidden();

    concederPermisos($this->miembro, 'pedidos.create-abono');
    $this->actingAs($this->miembro)->post(route('pedidos.abonos.store', [$pedido]), $datos)->assertRedirect();
    $abono = Abono::firstOrFail();

    $this->actingAs($this->miembro)->patch(route('pedidos.abonos.update', [$pedido, $abono]), ['puc_id' => $puc->id, 'monto' => 200])->assertForbidden();
    $this->actingAs($this->miembro)->delete(route('pedidos.abonos.destroy', [$pedido, $abono]))->assertForbidden();

    concederPermisos($this->miembro, ['pedidos.update-abono', 'pedidos.delete-abono']);
    $this->actingAs($this->miembro)->patch(route('pedidos.abonos.update', [$pedido, $abono]), ['puc_id' => $puc->id, 'monto' => 200])->assertRedirect();
    $this->actingAs($this->miembro)->delete(route('pedidos.abonos.destroy', [$pedido, $abono]))->assertRedirect();
    expect(Abono::count())->toBe(0);
});

test('the POS history is limited to the own pedidos without pos.view-all-pedidos', function () {
    $mio = Pedido::factory()->create(['user_id' => $this->miembro->id]);
    $ajeno = Pedido::factory()->create(['user_id' => User::factory()->create()->id]);
    concederPermisos($this->miembro, 'pos.view');

    $ids = fn () => collect($this->actingAs($this->miembro)->getJson(route('pos.pedidos'))->json('data'))->pluck('id')->all();

    expect($ids())->toBe([$mio->id]);

    // Asking for somebody else's pedidos does not get around it.
    expect(collect($this->actingAs($this->miembro)->getJson(route('pos.pedidos', ['user_id' => $ajeno->user_id]))->json('data'))->pluck('id')->all())
        ->toBe([$mio->id]);

    $this->actingAs($this->miembro)->getJson(route('pos.pedidos.voucher', [$ajeno->id]))->assertForbidden();
    $this->actingAs($this->miembro)->getJson(route('pos.pedidos.voucher', [$mio->id]))->assertOk();

    concederPermisos($this->miembro, 'pos.view-all-pedidos');
    expect($ids())->toContain($mio->id, $ajeno->id);
    $this->actingAs($this->miembro)->getJson(route('pos.pedidos.voucher', [$ajeno->id]))->assertOk();
});

test('the POS can create clientes and productos with its own permissions', function () {
    concederPermisos($this->miembro, 'pos.view');
    $cliente = ['tipo_documento' => 'CC', 'numero_documento' => '123', 'razon_social' => 'Cliente POS', 'retenedor_fuente' => 'NO', 'activo' => true];

    $this->actingAs($this->miembro)->post(route('clientes.store'), $cliente + ['desde_pos' => 1])->assertForbidden();

    concederPermisos($this->miembro, 'pos.create-cliente');
    $this->actingAs($this->miembro)->post(route('clientes.store'), $cliente + ['desde_pos' => 1])->assertRedirect();
    expect(Cliente::where('razon_social', 'Cliente POS')->exists())->toBeTrue();

    // The permission only counts from the POS, not for the clientes module.
    $this->actingAs($this->miembro)->post(route('clientes.store'), ['numero_documento' => '999', 'razon_social' => 'Otro'] + $cliente)->assertForbidden();

    $producto = ['categoria' => 'OTRO', 'tipo' => 'NUEVO', 'referencia_producto' => 'X-1', 'stay_on_page' => 1];
    $this->actingAs($this->miembro)->post(route('productos.store'), $producto)->assertForbidden();

    concederPermisos($this->miembro, 'pos.create-producto');
    $this->actingAs($this->miembro)->post(route('productos.store'), $producto)->assertRedirect();
    expect(Producto::where('referencia_producto', 'X-1')->exists())->toBeTrue();
});

test('the POS page offers creating only with the matching permissions', function () {
    concederPermisos($this->miembro, ['pos.view', 'pos.create-cliente']);

    $this->actingAs($this->miembro)->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page
            ->where('canCreateCliente', true)
            ->where('canCreateProducto', false)
            ->where('canViewAllPedidos', false)
        );
});

test('costs and prices of the stock listing go only to whoever may see the inversion', function () {
    StockBodega::create(['bodega_id' => Bodega::factory()->create()->id, 'producto_id' => Producto::factory()->create()->id, 'stock_inicial' => 1, 'entradas' => 0, 'salidas' => 0, 'stock' => 1]);
    concederPermisos($this->miembro, 'stock-bodegas.view');

    $this->actingAs($this->miembro)->get(route('stock-bodegas.index'))
        ->assertInertia(fn ($page) => $page
            ->where('canViewInversion', false)
            ->missing('productos.0.costo_producto')
            ->missing('productos.0.valor_detal')
            ->missing('productos.0.valor_mayorista')
        );

    concederPermisos($this->miembro, 'stock-bodegas.view-inversion');
    $this->actingAs($this->miembro)->get(route('stock-bodegas.index'))
        ->assertInertia(fn ($page) => $page
            ->where('canViewInversion', true)
            ->has('productos.0.costo_producto')
            ->has('productos.0.valor_detal')
        );
});

/**
 * Gives permissions straight to a user.
 *
 * @param  array<int, string>|string  $permisos
 */
function concederPermisos(User $usuario, array|string $permisos): void
{
    $usuario->givePermissionTo($permisos);
}

test('a role saves its authorized bodegas and the selects only offer those', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');
    [$a, $b, $c] = Bodega::factory()->count(3)->create();

    $this->actingAs($owner)->post(route('roles.store'), [
        'name' => 'Vendedor',
        'permissions' => ['pedidos.view'],
        'bodegas' => [$a->id, $b->id],
    ])->assertRedirect();

    $role = Role::where('name', 'Vendedor')->firstOrFail();
    expect($role->bodegas->pluck('id')->sort()->values()->all())->toBe([$a->id, $b->id]);

    $this->actingAs($owner)->get(route('roles.index'))
        ->assertInertia(fn ($page) => $page->has('bodegas', 3)->where('roles.2.bodegas', [$a->id, $b->id]));
    $this->miembro->assignRole($role);
    concederPermisos($this->miembro, ['pos.view']);

    $this->actingAs($this->miembro)->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page->has('bodegas', 2));

    // Without bodegas selected the role is unrestricted.
    $role->bodegas()->sync([]);
    $this->actingAs($this->miembro->fresh())->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page->has('bodegas', 3));
});

test('the dashboard only computes the parts the role may see', function () {
    concederPermisos($this->miembro, ['dashboard.widget-ganancia']);

    $this->actingAs($this->miembro)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('permisos.widget-ganancia', true)
            ->where('permisos.chart-pedidos', false)
            ->where('graficos', null)
            ->where('cantidadPorBodega', null)
            ->has('resumen')
        );
});

test('admin has no bypass: its permissions are edited like any other role', function () {
    $admin = User::factory()->create();
    asignarRol($admin, 'Admin');
    $rol = Role::where('name', 'Admin')->firstOrFail();
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($admin)->get(route('clientes.index'))->assertOk();

    $this->actingAs($owner)->patch(route('roles.update', [$rol]), [
        'name' => 'Admin',
        'permissions' => ['pedidos.view'],
        'bodegas' => [],
    ])->assertRedirect();
    $this->actingAs($admin->fresh())->get(route('clientes.index'))->assertForbidden();
});

test('roles can be deleted and only by whoever may', function () {
    $role = Role::create(['name' => 'Temporal']);
    concederPermisos($this->miembro, ['roles.view']);

    $this->actingAs($this->miembro)->delete(route('roles.destroy', [$role]))->assertForbidden();

    concederPermisos($this->miembro, ['roles.delete']);
    $this->actingAs($this->miembro)->delete(route('roles.destroy', [$role]))->assertRedirect();

    expect(Role::where('name', 'Temporal')->exists())->toBeFalse();
});

test('authorized bodegas limit the POS, dashboard and pedidos general, but not mayorista', function () {
    [$a, $b] = Bodega::factory()->count(2)->create();
    $role = Role::create(['name' => 'Sucursal']);
    $role->bodegas()->sync([$a->id]);
    $this->miembro->assignRole($role);
    concederPermisos($this->miembro, ['pos.view', 'pedidos.view', 'pedidos-mayoristas.view', 'dashboard.tabla-bodegas']);

    $enA = Pedido::factory()->create(['bodega_id' => $a->id, 'tipo_precio' => 'DETAL']);
    Pedido::factory()->create(['bodega_id' => $b->id, 'tipo_precio' => 'DETAL']);
    Pedido::factory()->create(['bodega_id' => $b->id, 'tipo_precio' => 'MAYORISTA']);

    $this->actingAs($this->miembro)->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page->has('bodegas', 1)->where('bodegas.0.id', $a->id));

    $this->actingAs($this->miembro)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->has('bodegas', 1)->where('bodegas.0.id', $a->id));

    $this->actingAs($this->miembro)->get(route('pedidos.index'))
        ->assertInertia(fn ($page) => $page->has('pedidos', 1)->where('pedidos.0.id', $enA->id));

    $this->actingAs($this->miembro)->get(route('pedidos-mayoristas.index'))
        ->assertInertia(fn ($page) => $page->has('pedidos', 1));
});

test('the sidebar count of pedidos general only counts the authorized bodegas', function () {
    [$a, $b] = Bodega::factory()->count(2)->create();
    $role = Role::create(['name' => 'Sucursal']);
    $role->bodegas()->sync([$a->id]);
    $this->miembro->assignRole($role);
    concederPermisos($this->miembro, ['pedidos.view', 'pedidos-mayoristas.view']);

    Pedido::factory()->count(2)->create(['bodega_id' => $a->id, 'tipo_precio' => 'DETAL']);
    Pedido::factory()->count(3)->create(['bodega_id' => $b->id, 'tipo_precio' => 'DETAL']);
    Pedido::factory()->count(4)->create(['bodega_id' => $b->id, 'tipo_precio' => 'MAYORISTA']);

    $this->actingAs($this->miembro)->get(route('pedidos.index'))
        ->assertInertia(fn ($page) => $page
            ->where('navCounts.pedidos', 2)
            ->where('navCounts.pedidosMayoristas', 4)
        );
});

test('a user without the costo price gets no costs in the POS, productos or pedidos', function () {
    $producto = Producto::factory()->create(['inventariable' => true, 'categoria' => 'LLANTA', 'costo_producto' => 50, 'valor_detal' => 100, 'valor_mayorista' => 90]);
    $pedido = Pedido::factory()->create(['tipo_precio' => 'DETAL']);
    DetallePedido::factory()->create(['pedido_id' => $pedido->id, 'producto_id' => $producto->id, 'costo_unitario' => 50, 'costo_total' => 100, 'ganancia_total' => 100]);
    concederPermisos($this->miembro, ['pos.view', 'productos.view', 'pedidos.view']);
    $this->miembro->update(['tipos_precio_permitidos' => ['valor_detal']]);

    $this->actingAs($this->miembro)->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page
            ->where('productos.0.valor_detal', '100.00')
            ->where('productos.0.valor_mayorista', null)
            ->where('productos.0.costo_producto', null)
        );

    $this->actingAs($this->miembro)->get(route('productos.index'))
        ->assertInertia(fn ($page) => $page
            ->where('productos.0.valor_detal', '100.00')
            ->where('productos.0.valor_mayorista', null)
            ->where('productos.0.costo_producto', null)
        );

    $this->actingAs($this->miembro)->get(route('pedidos.index'))
        ->assertInertia(fn ($page) => $page
            ->missing('pedidos.0.detalles.0.costo_unitario')
            ->missing('pedidos.0.detalles.0.ganancia_total')
        );

    $this->miembro->update(['tipos_precio_permitidos' => null]);

    $this->actingAs($this->miembro)->get(route('pedidos.index'))
        ->assertInertia(fn ($page) => $page->has('pedidos.0.detalles.0.costo_unitario'));
});

test('the dashboard has no mayorista group without the mayorista price', function () {
    concederPermisos($this->miembro, ['dashboard.tabla-bodegas']);

    $this->actingAs($this->miembro)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('cantidadPorBodega.filas', fn ($filas) => collect($filas)->contains('almacen', 'Mayorista')));

    $this->miembro->update(['tipos_precio_permitidos' => ['valor_detal', 'costo']]);

    $this->actingAs($this->miembro)->get(route('dashboard', ['bodega_ids' => ['mayorista']]))
        ->assertInertia(fn ($page) => $page
            ->where('cantidadPorBodega.filas', fn ($filas) => ! collect($filas)->contains('almacen', 'Mayorista'))
            ->where('filtros.bodega_ids', [])
        );
});

test('the dashboard alerts of the best selling products that ran out of stock', function () {
    $bodega = Bodega::factory()->create();
    $agotadoMuy = Producto::factory()->create(['inventariable' => true]);
    $agotadoPoco = Producto::factory()->create(['inventariable' => true]);
    $conStock = Producto::factory()->create(['inventariable' => true]);
    $pedido = Pedido::factory()->create(['bodega_id' => $bodega->id]);

    foreach ([[$agotadoMuy, 9], [$agotadoPoco, 2], [$conStock, 20]] as [$producto, $cantidad]) {
        DetallePedido::factory()->create(['pedido_id' => $pedido->id, 'producto_id' => $producto->id, 'cantidad' => $cantidad]);
    }

    StockBodega::create(['bodega_id' => $bodega->id, 'producto_id' => $agotadoMuy->id, 'stock_inicial' => 0, 'entradas' => 0, 'salidas' => 0, 'stock' => 0]);
    StockBodega::create(['bodega_id' => $bodega->id, 'producto_id' => $agotadoPoco->id, 'stock_inicial' => 0, 'entradas' => 0, 'salidas' => 0, 'stock' => -1]);
    StockBodega::create(['bodega_id' => $bodega->id, 'producto_id' => $conStock->id, 'stock_inicial' => 5, 'entradas' => 0, 'salidas' => 0, 'stock' => 5]);

    concederPermisos($this->miembro, ['dashboard.alerta-stock']);

    $this->actingAs($this->miembro)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->has('sinStock', 2)
            ->where('sinStock.0.id', $agotadoMuy->id)
            ->where('sinStock.0.vendidas', 9)
            ->where('sinStock.1.id', $agotadoPoco->id)
            ->where('sinStock.1.stock', -1)
        );

    $this->miembro->revokePermissionTo('dashboard.alerta-stock');

    $this->actingAs($this->miembro->fresh())->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('sinStock', null));
});

test('paying less than the monto registers a partial abono of what was paid', function () {
    $pedido = Pedido::factory()->create(['total_a_pagar' => 2000]);
    $puc = Puc::factory()->create();
    concederPermisos($this->miembro, ['pedidos.view', 'pedidos.update', 'pedidos.create-abono', 'pedidos.update-abono']);

    $this->actingAs($this->miembro)->post(route('pedidos.abonos.store', [$pedido]), ['puc_id' => $puc->id, 'monto' => 2000, 'con_cuanto_pago' => 500])->assertSessionHasNoErrors();

    $abono = Abono::firstOrFail();
    expect((float) $abono->monto)->toBe(500.0);
    expect((float) $abono->cambio)->toBe(0.0);
    expect((float) $pedido->fresh()->saldo_pendiente)->toBe(1500.0);

    $this->actingAs($this->miembro)->patch(route('pedidos.abonos.update', [$pedido, $abono]), ['puc_id' => $puc->id, 'monto' => 2000, 'con_cuanto_pago' => 2500])->assertSessionHasNoErrors();

    expect((float) $abono->fresh()->monto)->toBe(2000.0);
    expect((float) $abono->fresh()->cambio)->toBe(500.0);
});
