<?php

use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Puc;
use App\Models\StockBodega;
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
