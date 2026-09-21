<?php

use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\Puc;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('puc.view');
    Permission::findOrCreate('puc.create');
    Permission::findOrCreate('puc.update');
    Permission::findOrCreate('puc.delete');
});

test('owners can view, create, update and delete pucs without a custom role', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->get(route('pucs.index'))->assertOk();

    $this->actingAs($owner)->post(route('pucs.store'), [
        'tipo' => '1',
        'cuenta' => '11',
        'subcuenta' => '1105',
        'concepto' => 'Caja',
    ])->assertRedirect();

    $puc = Puc::firstOrFail();
    expect($puc->concatenar_subcuenta_concepto)->toBe('1105 - Caja');

    $this->actingAs($owner)->patch(route('pucs.update', [$puc]), [
        'tipo' => '1',
        'cuenta' => '11',
        'subcuenta' => '1105',
        'concepto' => 'Caja general',
    ])->assertRedirect();

    expect($puc->fresh()->concepto)->toBe('Caja general');
    expect($puc->fresh()->concatenar_subcuenta_concepto)->toBe('1105 - Caja general');

    $this->actingAs($owner)->delete(route('pucs.destroy', [$puc]))
        ->assertRedirect();

    expect(Puc::find($puc->id))->toBeNull();
});

test('members without permission cannot view pucs', function () {
    $member = User::factory()->create();
    asignarRol($member, 'Member');

    $this->actingAs($member)->get(route('pucs.index'))->assertForbidden();
});

test('tipo must be one of the valid puc classes', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)->post(route('pucs.store'), [
        'tipo' => '99',
        'cuenta' => '11',
        'subcuenta' => '1105',
        'concepto' => 'Caja',
    ])->assertSessionHasErrors('tipo');
});

test('subcuenta must be unique', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    Puc::factory()->create(['subcuenta' => '1105']);

    $this->actingAs($owner)->post(route('pucs.store'), [
        'tipo' => '1',
        'cuenta' => '11',
        'subcuenta' => '1105',
        'concepto' => 'Duplicado',
    ])->assertSessionHasErrors('subcuenta');
});

test('a puc with associated abonos cannot be deleted', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $puc = Puc::factory()->create();
    $cliente = Cliente::factory()->create();
    $bodega = Bodega::factory()->create();

    DB::table('pedidos')->insert([
        'cliente_id' => $cliente->id,
        'fecha' => now()->toDateString(),
        'bodega_id' => $bodega->id,
        'user_id' => $owner->id,
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $pedidoId = DB::getPdo()->lastInsertId();

    DB::table('abonos')->insert([
        'fecha' => now(),
        'monto' => 100,
        'cambio' => 0,
        'puc_id' => $puc->id,
        'pedido_id' => $pedidoId,
        'user_id' => $owner->id,
        'created_at' => now(), 'updated_at' => now(),
    ]);

    $response = $this->actingAs($owner)->delete(route('pucs.destroy', [$puc]));

    $response->assertRedirect();
    expect(Puc::find($puc->id))->not->toBeNull();
});
