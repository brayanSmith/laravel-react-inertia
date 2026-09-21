<?php

use App\Models\Bodega;
use App\Models\Producto;
use App\Models\StockBodega;
use App\Models\User;
use Illuminate\Support\Facades\DB;

function catalogoOwner(): User
{
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    return $owner;
}

test('the POS catalog is served from cache until a product changes', function () {
    $owner = catalogoOwner();
    $producto = Producto::factory()->create(['inventariable' => true, 'categoria' => 'LLANTA', 'valor_detal' => 100]);

    $this->actingAs($owner)->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page->where('productos.0.valor_detal', '100.00'));

    // A change that bypasses the model events is not seen: it is cached.
    DB::table('productos')->where('id', $producto->id)->update(['valor_detal' => 999]);

    $this->actingAs($owner)->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page->where('productos.0.valor_detal', '100.00'));

    // Saving through the model drops the cache.
    $producto->refresh()->update(['valor_detal' => 250]);

    $this->actingAs($owner)->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page->where('productos.0.valor_detal', '250.00'));
});

test('a stock change refreshes the POS catalog and the stock per bodega', function () {
    $owner = catalogoOwner();
    $producto = Producto::factory()->create(['inventariable' => true, 'categoria' => 'LLANTA']);
    $bodega = Bodega::factory()->create();

    $this->actingAs($owner)->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page->where('productos.0.stock_total', 0));

    $stock = StockBodega::create([
        'bodega_id' => $bodega->id,
        'producto_id' => $producto->id,
        'stock_inicial' => 0,
        'entradas' => 6,
        'salidas' => 0,
        'stock' => 6,
    ]);

    $this->actingAs($owner)->get(route('pos.index'))
        ->assertInertia(fn ($page) => $page->where('productos.0.stock_total', 6));

    $this->actingAs($owner)->get(route('stock-bodegas.index'))
        ->assertInertia(fn ($page) => $page->loadDeferredProps(fn ($loaded) => $loaded
            ->where('stockPorProducto.productos.0.stocks.'.$bodega->id.'.3', 6)
        ));

    $stock->update(['stock' => 2]);

    $this->actingAs($owner)->get(route('stock-bodegas.index'))
        ->assertInertia(fn ($page) => $page->loadDeferredProps(fn ($loaded) => $loaded
            ->where('stockPorProducto.productos.0.stocks.'.$bodega->id.'.3', 2)
        ));
});
