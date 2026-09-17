<?php

use App\Models\Bodega;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('bodegas.view');
    Permission::findOrCreate('bodegas.create');
    Permission::findOrCreate('bodegas.update');
    Permission::findOrCreate('bodegas.delete');
});

test('owners can view, create, update and delete bodegas without a custom role', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    $this->actingAs($owner)->get(route('bodegas.index', $team))->assertOk();

    $this->actingAs($owner)->post(route('bodegas.store', $team), [
        'nombre_bodega' => 'Bodega Principal',
        'ubicacion_bodega' => 'Calle 1',
    ])->assertRedirect();

    $bodega = Bodega::firstOrFail();

    $this->actingAs($owner)->patch(route('bodegas.update', [$team, $bodega]), [
        'nombre_bodega' => 'Bodega Actualizada',
        'ubicacion_bodega' => 'Calle 2',
    ])->assertRedirect();

    expect($bodega->fresh()->nombre_bodega)->toBe('Bodega Actualizada');

    $this->actingAs($owner)->delete(route('bodegas.destroy', [$team, $bodega]))
        ->assertRedirect();

    expect(Bodega::find($bodega->id))->toBeNull();
});

test('members without permission cannot view bodegas', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');

    $this->actingAs($member)->get(route('bodegas.index', $team))->assertForbidden();
});

test('nombre_bodega must be unique', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    Bodega::factory()->create(['nombre_bodega' => 'Bodega Norte']);

    $this->actingAs($owner)->post(route('bodegas.store', $team), [
        'nombre_bodega' => 'Bodega Norte',
    ])->assertSessionHasErrors('nombre_bodega');
});

test('a bodega with associated stock cannot be deleted', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    $bodega = Bodega::factory()->create();

    DB::table('productos')->insert([
        'referencia_producto' => 'REF-1',
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $productoId = DB::getPdo()->lastInsertId();

    DB::table('stock_bodegas')->insert([
        'bodega_id' => $bodega->id,
        'producto_id' => $productoId,
        'created_at' => now(), 'updated_at' => now(),
    ]);

    $response = $this->actingAs($owner)->delete(route('bodegas.destroy', [$team, $bodega]));

    $response->assertRedirect();
    expect(Bodega::find($bodega->id))->not->toBeNull();
});
