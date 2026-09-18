<?php

use App\Models\Bodega;
use App\Models\Gasto;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('gastos.view');
    Permission::findOrCreate('gastos.create');
    Permission::findOrCreate('gastos.update');
    Permission::findOrCreate('gastos.delete');
});

test('owners can view, create, update and delete gastos without a custom role', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');
    $bodega = Bodega::factory()->create();

    $this->actingAs($owner)->get(route('gastos.index', $team))->assertOk();

    $this->actingAs($owner)->post(route('gastos.store', $team), [
        'bodega_id' => $bodega->id,
        'descripcion' => 'Compra de insumos',
        'monto' => 150.50,
        'fecha_gasto' => '2026-01-10',
    ])->assertRedirect();

    $gasto = Gasto::firstOrFail();
    expect($gasto->user_id)->toBe($owner->id);

    $this->actingAs($owner)->patch(route('gastos.update', [$team, $gasto]), [
        'bodega_id' => $bodega->id,
        'descripcion' => 'Compra de insumos actualizada',
        'monto' => 200,
        'fecha_gasto' => '2026-01-12',
    ])->assertRedirect();

    expect($gasto->fresh()->descripcion)->toBe('Compra de insumos actualizada');

    $this->actingAs($owner)->delete(route('gastos.destroy', [$team, $gasto]))
        ->assertRedirect();

    expect(Gasto::find($gasto->id))->toBeNull();
});

test('members without permission cannot view gastos', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');

    $this->actingAs($member)->get(route('gastos.index', $team))->assertForbidden();
});

test('descripcion, monto and fecha_gasto are required', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    $this->actingAs($owner)->post(route('gastos.store', $team), [])
        ->assertSessionHasErrors(['descripcion', 'monto', 'fecha_gasto']);
});
