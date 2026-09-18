<?php

use App\Models\StockBodega;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('stock-bodegas.view');
});

test('owners can view stock por bodega without a custom role', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');
    $stockBodega = StockBodega::factory()->create();

    $response = $this->actingAs($owner)->get(route('stock-bodegas.index', $team))->assertOk();

    $response->assertInertia(fn ($page) => $page
        ->component('stock-bodegas/index')
        ->has('stockBodegas', 1)
        ->where('stockBodegas.0.id', $stockBodega->id)
        ->where('stockBodegas.0.stock_inicial', $stockBodega->stock_inicial)
    );
});

test('members without permission cannot view stock por bodega', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');

    $this->actingAs($member)->get(route('stock-bodegas.index', $team))->assertForbidden();
});
