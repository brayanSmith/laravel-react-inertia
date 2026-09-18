<?php

use App\Models\Bodega;
use App\Models\Producto;
use App\Models\StockBodega;
use App\Models\Team;
use App\Models\Traslado;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('traslados.view');
    Permission::findOrCreate('traslados.create');
    Permission::findOrCreate('traslados.update');
    Permission::findOrCreate('traslados.delete');
});

test('owners can view, create, update and delete traslados without a custom role', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');
    $producto = Producto::factory()->create();
    $bodegaDonante = Bodega::factory()->create();
    $bodegaDestino = Bodega::factory()->create();

    $this->actingAs($owner)->get(route('traslados.index', $team))->assertOk();

    $this->actingAs($owner)->post(route('traslados.store', $team), [
        'producto_id' => $producto->id,
        'bodega_donante_id' => $bodegaDonante->id,
        'bodega_destino_id' => $bodegaDestino->id,
        'cantidad' => 10,
        'observaciones' => 'Traslado inicial',
    ])->assertRedirect();

    $traslado = Traslado::firstOrFail();
    expect($traslado->cantidad)->toBe(10);

    $stockDonante = StockBodega::where('producto_id', $producto->id)->where('bodega_id', $bodegaDonante->id)->firstOrFail();
    $stockDestino = StockBodega::where('producto_id', $producto->id)->where('bodega_id', $bodegaDestino->id)->firstOrFail();
    expect((float) $stockDonante->salidas)->toBe(10.0);
    expect((float) $stockDonante->stock)->toBe(-10.0);
    expect((float) $stockDestino->entradas)->toBe(10.0);
    expect((float) $stockDestino->stock)->toBe(10.0);

    $this->actingAs($owner)->patch(route('traslados.update', [$team, $traslado]), [
        'producto_id' => $producto->id,
        'bodega_donante_id' => $bodegaDonante->id,
        'bodega_destino_id' => $bodegaDestino->id,
        'cantidad' => 6,
        'observaciones' => 'Traslado ajustado',
    ])->assertRedirect();

    expect($traslado->fresh()->cantidad)->toBe(6);
    expect((float) $stockDonante->fresh()->stock)->toBe(-6.0);
    expect((float) $stockDestino->fresh()->stock)->toBe(6.0);

    $this->actingAs($owner)->delete(route('traslados.destroy', [$team, $traslado]))
        ->assertRedirect();

    expect(Traslado::find($traslado->id))->toBeNull();
    expect((float) $stockDonante->fresh()->stock)->toBe(0.0);
    expect((float) $stockDestino->fresh()->stock)->toBe(0.0);
});

test('members without permission cannot view traslados', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');

    $this->actingAs($member)->get(route('traslados.index', $team))->assertForbidden();
});

test('bodega_donante_id, bodega_destino_id, producto_id and cantidad are required', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    $this->actingAs($owner)->post(route('traslados.store', $team), [])
        ->assertSessionHasErrors(['producto_id', 'bodega_donante_id', 'bodega_destino_id', 'cantidad']);
});

test('the destination bodega must be different from the donor bodega', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');
    $producto = Producto::factory()->create();
    $bodega = Bodega::factory()->create();

    $this->actingAs($owner)->post(route('traslados.store', $team), [
        'producto_id' => $producto->id,
        'bodega_donante_id' => $bodega->id,
        'bodega_destino_id' => $bodega->id,
        'cantidad' => 5,
    ])->assertSessionHasErrors(['bodega_destino_id']);
});
