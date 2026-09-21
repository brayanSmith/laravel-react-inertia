<?php

use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\Compra;
use App\Models\Empresa;
use App\Models\Gasto;
use App\Models\Marca;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Puc;
use App\Models\Role;
use App\Models\StockBodega;
use App\Models\StockInicial;
use App\Models\Traslado;
use App\Models\User;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    $this->owner = User::factory()->create();
    asignarRol($this->owner, 'Owner');
    $this->bodega = Bodega::factory()->create();
    $this->producto = Producto::factory()->create(['concatenar_codigo_nombre' => 'LLANTA 175/70']);
    StockBodega::create(['bodega_id' => $this->bodega->id, 'producto_id' => $this->producto->id, 'stock_inicial' => 50, 'entradas' => 0, 'salidas' => 0, 'stock' => 50]);
    $this->cliente = Cliente::factory()->create();

    $this->formulario = fn (int $cantidad, string $observacion = 'inicial') => [
        'cliente_id' => $this->cliente->id,
        'fecha' => '2026-01-10 10:00:00',
        'user_id' => $this->owner->id,
        'bodega_id' => $this->bodega->id,
        'tipo_precio' => 'DETAL',
        'observacion' => $observacion,
        'detalles' => [['producto_id' => $this->producto->id, 'cantidad' => $cantidad, 'precio_unitario' => 100]],
    ];
});

test('the history records who created, edited, deleted and restored a pedido', function () {
    $this->actingAs($this->owner)->post(route('pedidos.store'), ($this->formulario)(2))->assertRedirect();
    $pedido = Pedido::firstOrFail();

    $creado = Activity::where('description', 'Pedido creado')->firstOrFail();
    expect($creado->causer_id)->toBe($this->owner->id);
    expect($creado->subject_id)->toBe($pedido->id);
    expect(Activity::where('event', 'detalles')->count())->toBe(1);

    $this->actingAs($this->owner)->patch(route('pedidos.update', [$pedido]), ($this->formulario)(5, 'cambiada'))->assertRedirect();

    $editado = Activity::where('description', 'Pedido editado')->firstOrFail();
    expect($editado->properties['old']['observacion'])->toBe('inicial');
    expect($editado->properties['attributes']['observacion'])->toBe('cambiada');

    $productos = Activity::where('description', 'Productos del pedido modificados')->firstOrFail();
    expect($productos->properties['old']['productos'][0]['cantidad'])->toBe(2);
    expect($productos->properties['attributes']['productos'][0]['cantidad'])->toBe(5);

    $this->actingAs($this->owner)->delete(route('pedidos.destroy', [$pedido]))->assertRedirect();
    expect(Activity::where('description', 'Pedido eliminado')->exists())->toBeTrue();

    $this->actingAs($this->owner)->patch(route('pedidos.restore', [$pedido->id]))->assertRedirect();
    expect(Activity::where('description', 'Pedido restaurado')->exists())->toBeTrue();
});

test('an edit that changes nothing leaves no entry, and the totals are not logged on their own', function () {
    $this->actingAs($this->owner)->post(route('pedidos.store'), ($this->formulario)(2))->assertRedirect();
    $pedido = Pedido::firstOrFail();
    $antes = Activity::count();

    $this->actingAs($this->owner)->patch(route('pedidos.update', [$pedido]), ($this->formulario)(2))->assertRedirect();

    expect(Activity::count())->toBe($antes);
});

test('the abonos of a pedido are in the history too', function () {
    $this->actingAs($this->owner)->post(route('pedidos.store'), ($this->formulario)(2))->assertRedirect();
    $pedido = Pedido::firstOrFail();
    $puc = Puc::factory()->create();

    $this->actingAs($this->owner)->post(route('pedidos.abonos.store', [$pedido]), ['puc_id' => $puc->id, 'monto' => 50])->assertRedirect();

    $abono = Activity::where('description', 'Abono registrado')->firstOrFail();
    expect($abono->causer_id)->toBe($this->owner->id);
    expect((float) $abono->properties['attributes']['monto'])->toBe(50.0);
});

test('the history page is only for whoever has the permission', function () {
    $this->actingAs($this->owner)->post(route('pedidos.store'), ($this->formulario)(2))->assertRedirect();

    $this->actingAs($this->owner)->get(route('historial.index'))
        ->assertInertia(fn ($page) => $page
            ->component('historial/index')
            ->where('actividades.0.usuario', $this->owner->name)
            ->where('actividades.0.modulo', 'Pedidos')
        );

    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)->get(route('historial.index'))->assertForbidden();
});

test('the history records who created, edited, received, deleted and restored a compra', function () {
    $proveedor = Proveedor::factory()->create(['nombre_proveedor' => 'Proveedor Uno']);
    $compraFormulario = fn (bool $recibido, string $factura = 'FA01', int $cantidad = 2) => [
        'factura' => $factura,
        'proveedor_id' => $proveedor->id,
        'fecha' => '2026-01-10 10:00:00',
        'detalles' => [['producto_id' => $this->producto->id, 'bodega_id' => $this->bodega->id, 'cantidad' => $cantidad, 'precio_unitario' => 100, 'recibido' => $recibido]],
    ];

    $this->actingAs($this->owner)->post(route('compras.store'), $compraFormulario(false))->assertRedirect();
    $compra = Compra::firstOrFail();

    $creada = Activity::where('description', 'Compra creada')->firstOrFail();
    expect($creada->causer_id)->toBe($this->owner->id);
    expect(Activity::where('description', 'Productos de la compra')->count())->toBe(1);

    $this->actingAs($this->owner)->patch(route('compras.update', [$compra]), $compraFormulario(true, 'FA99', 4))->assertRedirect();

    $editada = Activity::where('description', 'Compra editada')->firstOrFail();
    expect($editada->properties['old']['factura'])->toBe('FA01');
    expect($editada->properties['attributes']['factura'])->toBe('FA99');

    $productos = Activity::where('description', 'Productos de la compra modificados')->firstOrFail();
    expect($productos->properties['old']['productos'][0]['estado'])->toBe('PENDIENTE');
    expect($productos->properties['attributes']['productos'][0]['estado'])->toBe('RECIBIDA');
    expect($productos->properties['attributes']['productos'][0]['cantidad'])->toBe(4);

    $this->actingAs($this->owner)->delete(route('compras.destroy', [$compra]))->assertRedirect();
    expect(Activity::where('description', 'Compra eliminada')->exists())->toBeTrue();

    $this->actingAs($this->owner)->patch(route('compras.restore', [$compra->id]))->assertRedirect();
    expect(Activity::where('description', 'Compra restaurada')->exists())->toBeTrue();

    $this->actingAs($this->owner)->get(route('historial.index'))
        ->assertInertia(fn ($page) => $page->where('actividades', fn ($actividades) => collect($actividades)->contains(fn ($a) => $a['modulo'] === 'Compras' && $a['registro'] === 'Compra #'.$compra->id)));
});

test('the history records the changes of a producto and hides the prices its reader may not see', function () {
    $marca = Marca::factory()->create(['marca' => 'WANDA']);
    $this->actingAs($this->owner)->post(route('productos.store'), [
        'categoria' => 'OTRO',
        'tipo' => 'NUEVO',
        'referencia_producto' => 'REF-1',
        'marca_id' => $marca->id,
        'costo_producto' => 50000,
        'valor_detal' => 80000,
    ])->assertRedirect();

    $producto = Producto::where('referencia_producto', 'REF-1')->firstOrFail();
    expect(Activity::where('description', 'Producto creado')->where('subject_id', $producto->id)->exists())->toBeTrue();

    $this->actingAs($this->owner)->patch(route('productos.update', [$producto]), [
        'categoria' => 'OTRO',
        'tipo' => 'NUEVO',
        'referencia_producto' => 'REF-1',
        'marca_id' => $marca->id,
        'costo_producto' => 50000,
        'valor_detal' => 90000,
    ])->assertRedirect();

    $editado = Activity::where('description', 'Producto editado')->firstOrFail();
    expect((float) $editado->properties['old']['valor_detal'])->toBe(80000.0);
    expect((float) $editado->properties['attributes']['valor_detal'])->toBe(90000.0);
    expect($editado->properties['attributes'])->not->toHaveKey('costo_producto');

    $this->actingAs($this->owner)->get(route('historial.index'))
        ->assertInertia(fn ($page) => $page->where('actividades', fn ($actividades) => collect($actividades)->contains(fn ($a) => $a['modulo'] === 'Productos'
            && str_contains($a['registro'], 'REF-1')
            && collect($a['cambios'])->contains(fn ($c) => $c['campo'] === 'Valor detal' && $c['antes'] === '$80.000' && $c['despues'] === '$90.000'))));

    // Without the costo price its changes are not shown.
    $this->owner->update(['tipos_precio_permitidos' => ['valor_detal']]);

    $this->actingAs($this->owner->fresh())->get(route('historial.index'))
        ->assertInertia(fn ($page) => $page->where('actividades', fn ($actividades) => ! collect($actividades)
            ->flatMap(fn ($a) => $a['cambios'])
            ->contains(fn ($c) => $c['campo'] === 'Costo')));

    $this->actingAs($this->owner)->delete(route('productos.destroy', [$producto]))->assertRedirect();
    expect(Activity::where('description', 'Producto eliminado')->exists())->toBeTrue();
});

test('the history records the changes of a cliente', function () {
    $datos = fn (string $razon, string $telefono) => [
        'tipo_documento' => 'CC',
        'numero_documento' => '1234567890',
        'razon_social' => $razon,
        'telefono' => $telefono,
        'retenedor_fuente' => 'NO',
    ];

    $this->actingAs($this->owner)->post(route('clientes.store'), $datos('Cliente Uno', '3001'))->assertRedirect();
    $cliente = Cliente::where('numero_documento', '1234567890')->firstOrFail();

    expect(Activity::where('description', 'Cliente creado')->where('subject_id', $cliente->id)->firstOrFail()->causer_id)->toBe($this->owner->id);

    $this->actingAs($this->owner)->patch(route('clientes.update', [$cliente]), $datos('Cliente Uno', '3002'))->assertRedirect();

    $editado = Activity::where('description', 'Cliente editado')->firstOrFail();
    expect($editado->properties['old']['telefono'])->toBe('3001');
    expect($editado->properties['attributes']['telefono'])->toBe('3002');
    expect($editado->properties['attributes'])->not->toHaveKey('razon_social');

    $this->actingAs($this->owner)->delete(route('clientes.destroy', [$cliente]))->assertRedirect();
    $this->actingAs($this->owner)->patch(route('clientes.restore', [$cliente->id]))->assertRedirect();

    expect(Activity::where('description', 'Cliente eliminado')->exists())->toBeTrue();
    expect(Activity::where('description', 'Cliente restaurado')->exists())->toBeTrue();

    $this->actingAs($this->owner)->get(route('historial.index'))
        ->assertInertia(fn ($page) => $page->where('actividades', fn ($actividades) => collect($actividades)->contains(fn ($a) => $a['modulo'] === 'Clientes' && $a['registro'] === 'Cliente #'.$cliente->id.' · Cliente Uno')));
});

dataset('registros simples', [
    'gastos' => ['Gastos', 'Gasto', 'descripcion', fn () => Gasto::factory()->create(['descripcion' => 'Uno']), 'Dos', false],
    'proveedores' => ['Proveedores', 'Proveedor', 'nombre_proveedor', fn () => Proveedor::factory()->create(['nombre_proveedor' => 'Uno']), 'Dos', false],
    'marcas' => ['Marcas', 'Marca', 'marca', fn () => Marca::factory()->create(['marca' => 'Uno']), 'Dos', true],
    'bodegas' => ['Bodegas', 'Bodega', 'nombre_bodega', fn () => Bodega::factory()->create(['nombre_bodega' => 'Uno']), 'Dos', true],
    'stock inicial' => ['Stock inicial', 'Stock inicial', 'cantidad', fn () => StockInicial::factory()->create(['cantidad' => 5]), 9, false],
    'traslados' => ['Traslados', 'Traslado', 'cantidad', fn () => Traslado::factory()->create(['cantidad' => 5]), 9, false],
]);

test('the simple records write their creation, edition and deletion to the history', function (string $modulo, string $etiqueta, string $campo, Closure $crear, string|int $nuevo, bool $femenino) {
    $this->actingAs($this->owner);
    $registro = $crear();

    $sufijo = fn (string $base) => $etiqueta.' '.($femenino ? substr($base, 0, -1).'a' : $base);

    $creado = Activity::where('subject_type', $registro::class)->where('subject_id', $registro->id)->where('description', $sufijo('creado'))->firstOrFail();
    expect($creado->causer_id)->toBe($this->owner->id);

    $registro->update([$campo => $nuevo]);

    $editado = Activity::where('subject_type', $registro::class)->where('description', $sufijo('editado'))->firstOrFail();
    expect($editado->properties['attributes'][$campo])->toBe($nuevo);
    expect($editado->properties['attributes'])->toHaveCount(1);

    $registro->delete();
    expect(Activity::where('subject_type', $registro::class)->where('description', $sufijo('eliminado'))->exists())->toBeTrue();

    $this->get(route('historial.index'))
        ->assertInertia(fn ($page) => $page->where('actividades', fn ($actividades) => collect($actividades)->contains(fn ($a) => $a['modulo'] === $modulo)));
})->with('registros simples');

test('the history records the changes of usuarios, their roles and the permissions of a role, but never a password', function () {
    $this->actingAs($this->owner);
    $cajero = Role::create(['name' => 'Cajero']);

    $this->patch(route('roles.update', [$cajero]), [
        'name' => 'Cajero',
        'permissions' => ['pedidos.view', 'pos.view'],
        'bodegas' => [$this->bodega->id],
    ])->assertRedirect();

    $acceso = Activity::where('event', 'acceso')->firstOrFail();
    expect($acceso->properties['old']['permisos'])->toBe([]);
    expect($acceso->properties['attributes']['permisos'])->toBe(['pedidos.view', 'pos.view']);
    expect($acceso->properties['attributes']['bodegas'])->toBe([$this->bodega->nombre_bodega]);

    $this->patch(route('roles.update', [$cajero]), ['name' => 'Cajero', 'permissions' => ['pedidos.view', 'pos.view'], 'bodegas' => [$this->bodega->id]])->assertRedirect();
    expect(Activity::where('event', 'acceso')->count())->toBe(1);

    $this->post(route('usuarios.store'), [
        'name' => 'Empleado Uno',
        'email' => 'uno@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'tipos_precio_permitidos' => ['valor_detal'],
        'roles' => [$cajero->id],
    ])->assertRedirect();

    $usuario = User::where('email', 'uno@example.com')->firstOrFail();
    expect(Activity::where('description', 'Usuario creado')->where('subject_id', $usuario->id)->exists())->toBeTrue();

    $roles = Activity::where('event', 'roles')->firstOrFail();
    expect($roles->properties['attributes']['roles'])->toBe(['Cajero']);

    $this->patch(route('usuarios.precios.update', [$usuario]), ['tipos_precio_permitidos' => ['valor_detal', 'costo']])->assertRedirect();

    $editado = Activity::where('description', 'Usuario editado')->firstOrFail();
    expect($editado->properties['attributes']['tipos_precio_permitidos'])->toBe(['valor_detal', 'costo']);

    // No entry ever carries the password.
    expect(Activity::all()->contains(fn ($a) => str_contains($a->properties->toJson(), 'password')))->toBeFalse();

    $this->get(route('historial.index'))
        ->assertInertia(fn ($page) => $page->where('actividades', fn ($actividades) => collect($actividades)->contains(fn ($a) => $a['modulo'] === 'Usuarios'
            && collect($a['cambios'])->contains(fn ($c) => $c['campo'] === 'Precios permitidos' && $c['despues'] === 'Precio detal, Costo'))
            && collect($actividades)->contains(fn ($a) => $a['modulo'] === 'Roles'
                && collect($a['cambios'])->contains(fn ($c) => $c['campo'] === 'Permisos' && $c['despues'] === 'pedidos.view, pos.view'))));
});

test('the puc and the empresa are in the history too', function () {
    $this->actingAs($this->owner);
    $puc = Puc::factory()->create(['concepto' => 'Caja']);
    $puc->update(['concepto' => 'Caja general']);
    $empresa = Empresa::factory()->create(['nombre_empresa' => 'Llantas SAS']);
    $empresa->update(['telefono_empresa' => '3001112233']);

    expect(Activity::where('description', 'Puc editado')->firstOrFail()->properties['attributes']['concepto'])->toBe('Caja general');
    expect(Activity::where('description', 'Empresa editada')->firstOrFail()->properties['attributes']['telefono_empresa'])->toBe('3001112233');
});
