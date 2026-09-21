<?php

use App\Models\Bodega;
use App\Models\Compra;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\StockBodega;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('compras.view');
    Permission::findOrCreate('compras.create');
    Permission::findOrCreate('compras.update');
    Permission::findOrCreate('compras.delete');
});

test('owners can view and create compras with multiple bodega lines', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $proveedor = Proveedor::factory()->create();
    $producto = Producto::factory()->create();
    $bodegaA = Bodega::factory()->create();
    $bodegaB = Bodega::factory()->create();

    $this->actingAs($owner)->get(route('compras.index'))->assertOk();
    $this->actingAs($owner)->get(route('compras.create'))->assertOk();

    $response = $this->actingAs($owner)->post(route('compras.store'), [
        'factura' => 'FA01',
        'proveedor_id' => $proveedor->id,
        'fecha' => '2026-01-10 10:00:00',
        'observaciones' => 'Compra de prueba',
        'descuento' => 10,
        'detalles' => [
            [
                'producto_id' => $producto->id,
                'bodega_id' => $bodegaA->id,
                'cantidad' => 2,
                'precio_unitario' => 100,
                'recibido' => true,
            ],
            [
                'producto_id' => $producto->id,
                'bodega_id' => $bodegaB->id,
                'cantidad' => 3,
                'precio_unitario' => 100,
                'recibido' => false,
            ],
        ],
    ]);

    $response->assertRedirect();

    $compra = Compra::firstOrFail();
    expect((float) $compra->subtotal)->toBe(500.0);
    expect((float) $compra->total_a_pagar)->toBe(490.0);
    expect($compra->estado)->toBe('PENDIENTE');
    expect($compra->detallesCompra()->count())->toBe(2);

    $stockA = StockBodega::where('bodega_id', $bodegaA->id)->where('producto_id', $producto->id)->first();
    expect((float) $stockA->stock)->toBe(2.0);

    $stockB = StockBodega::where('bodega_id', $bodegaB->id)->where('producto_id', $producto->id)->first();
    expect($stockB)->toBeNull();
});

test('marking all lines as received updates estado and reverting on update adjusts stock', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $proveedor = Proveedor::factory()->create();
    $producto = Producto::factory()->create();
    $bodega = Bodega::factory()->create();

    $this->actingAs($owner)->post(route('compras.store'), [
        'factura' => 'FA02',
        'proveedor_id' => $proveedor->id,
        'fecha' => '2026-01-10 10:00:00',
        'detalles' => [
            [
                'producto_id' => $producto->id,
                'bodega_id' => $bodega->id,
                'cantidad' => 5,
                'precio_unitario' => 50,
                'recibido' => true,
            ],
        ],
    ]);

    $compra = Compra::firstOrFail();
    expect($compra->estado)->toBe('RECIBIDA');

    $stock = StockBodega::where('bodega_id', $bodega->id)->where('producto_id', $producto->id)->first();
    expect((float) $stock->stock)->toBe(5.0);

    $this->actingAs($owner)->patch(route('compras.update', [$compra]), [
        'factura' => 'FA02',
        'proveedor_id' => $proveedor->id,
        'fecha' => '2026-01-10 10:00:00',
        'detalles' => [
            [
                'producto_id' => $producto->id,
                'bodega_id' => $bodega->id,
                'cantidad' => 5,
                'precio_unitario' => 50,
                'recibido' => false,
            ],
        ],
    ])->assertRedirect();

    $compra->refresh();
    expect($compra->estado)->toBe('PENDIENTE');

    $stock->refresh();
    expect((float) $stock->stock)->toBe(0.0);
});

test('deleting a compra reverts received stock', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $proveedor = Proveedor::factory()->create();
    $producto = Producto::factory()->create();
    $bodega = Bodega::factory()->create();

    $this->actingAs($owner)->post(route('compras.store'), [
        'factura' => 'FA03',
        'proveedor_id' => $proveedor->id,
        'fecha' => '2026-01-10 10:00:00',
        'detalles' => [
            [
                'producto_id' => $producto->id,
                'bodega_id' => $bodega->id,
                'cantidad' => 4,
                'precio_unitario' => 25,
                'recibido' => true,
            ],
        ],
    ]);

    $compra = Compra::firstOrFail();

    $this->actingAs($owner)->delete(route('compras.destroy', [$compra]))
        ->assertRedirect();

    expect(Compra::find($compra->id))->toBeNull();

    $stock = StockBodega::where('bodega_id', $bodega->id)->where('producto_id', $producto->id)->first();
    expect((float) $stock->stock)->toBe(0.0);
});

test('members without permission cannot view compras', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)->get(route('compras.index'))->assertForbidden();
});

test('detalles are required to store a compra', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $proveedor = Proveedor::factory()->create();

    $this->actingAs($owner)->post(route('compras.store'), [
        'factura' => 'FA04',
        'proveedor_id' => $proveedor->id,
        'fecha' => '2026-01-10 10:00:00',
    ])->assertSessionHasErrors('detalles');
});
