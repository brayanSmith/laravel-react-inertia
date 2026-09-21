<?php

use App\Models\Bodega;
use App\Models\Producto;
use App\Models\StockBodega;
use App\Models\StockInicial;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('stock-iniciales.view');
    Permission::findOrCreate('stock-iniciales.create');
    Permission::findOrCreate('stock-iniciales.update');
    Permission::findOrCreate('stock-iniciales.delete');
});

test('owners can view, create, update and delete stock iniciales without a custom role', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');
    $producto = Producto::factory()->create();
    $bodega = Bodega::factory()->create();

    $this->actingAs($owner)->get(route('stock-iniciales.index'))->assertOk();

    $this->actingAs($owner)->post(route('stock-iniciales.store'), [
        'producto_id' => $producto->id,
        'bodega_id' => $bodega->id,
        'cantidad' => 25,
    ])->assertRedirect();

    $stockInicial = StockInicial::firstOrFail();
    expect($stockInicial->cantidad)->toBe(25);

    $stockBodega = StockBodega::where('producto_id', $producto->id)->where('bodega_id', $bodega->id)->firstOrFail();
    expect((float) $stockBodega->stock_inicial)->toBe(25.0);
    expect((float) $stockBodega->stock)->toBe(25.0);

    $this->actingAs($owner)->patch(route('stock-iniciales.update', [$stockInicial]), [
        'producto_id' => $producto->id,
        'bodega_id' => $bodega->id,
        'cantidad' => 40,
    ])->assertRedirect();

    expect($stockInicial->fresh()->cantidad)->toBe(40);
    expect((float) $stockBodega->fresh()->stock_inicial)->toBe(40.0);
    expect((float) $stockBodega->fresh()->stock)->toBe(40.0);

    $this->actingAs($owner)->delete(route('stock-iniciales.destroy', [$stockInicial]))
        ->assertRedirect();

    expect(StockInicial::find($stockInicial->id))->toBeNull();
    expect((float) $stockBodega->fresh()->stock_inicial)->toBe(0.0);
    expect((float) $stockBodega->fresh()->stock)->toBe(0.0);
});

test('moving a stock inicial to a different bodega shifts the stock accordingly', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');
    $producto = Producto::factory()->create();
    $bodegaOrigen = Bodega::factory()->create();
    $bodegaDestino = Bodega::factory()->create();

    $this->actingAs($owner)->post(route('stock-iniciales.store'), [
        'producto_id' => $producto->id,
        'bodega_id' => $bodegaOrigen->id,
        'cantidad' => 15,
    ])->assertRedirect();

    $stockInicial = StockInicial::firstOrFail();

    $this->actingAs($owner)->patch(route('stock-iniciales.update', [$stockInicial]), [
        'producto_id' => $producto->id,
        'bodega_id' => $bodegaDestino->id,
        'cantidad' => 15,
    ])->assertRedirect();

    $stockOrigen = StockBodega::where('producto_id', $producto->id)->where('bodega_id', $bodegaOrigen->id)->firstOrFail();
    $stockDestino = StockBodega::where('producto_id', $producto->id)->where('bodega_id', $bodegaDestino->id)->firstOrFail();

    expect((float) $stockOrigen->stock)->toBe(0.0);
    expect((float) $stockDestino->stock)->toBe(15.0);
});

test('members without permission cannot view stock iniciales', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)->get(route('stock-iniciales.index'))->assertForbidden();
});

test('producto_id, bodega_id and cantidad are required', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->post(route('stock-iniciales.store'), [])
        ->assertSessionHasErrors(['producto_id', 'bodega_id', 'cantidad']);
});
