<?php

use App\Models\StockBodega;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('stock-bodegas.view');
});

test('owners can view stock por bodega without a custom role', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');
    $stockBodega = StockBodega::factory()->create(['stock_inicial' => 5, 'entradas' => 3, 'salidas' => 1, 'stock' => 7]);

    $response = $this->actingAs($owner)->get(route('stock-bodegas.index'))->assertOk();

    $response->assertInertia(fn ($page) => $page
        ->component('stock-bodegas/index')
        ->has('stockBodegas', 1)
        ->where('stockBodegas.0.id', $stockBodega->id)
        ->where('stockBodegas.0.stock_inicial', $stockBodega->stock_inicial)
        ->has('productos', 1)
        ->has('bodegas', 1)
    );
});

test('members without permission cannot view stock por bodega', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)->get(route('stock-bodegas.index'))->assertForbidden();
});

test('pairs with nothing in them are not sent, but their product still is', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');
    $vacio = StockBodega::factory()->create(['stock_inicial' => 0, 'entradas' => 0, 'salidas' => 0, 'stock' => 0]);

    $this->actingAs($owner)->get(route('stock-bodegas.index'))
        ->assertInertia(fn ($page) => $page
            ->has('stockBodegas', 0)
            ->has('productos', 1)
            ->where('productos.0.id', $vacio->producto_id)
        );
});
