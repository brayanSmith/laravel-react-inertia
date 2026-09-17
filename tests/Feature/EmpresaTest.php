<?php

use App\Models\Empresa;
use App\Models\Team;
use App\Models\User;

test('owners can view and create the company profile without a custom role', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    $this->actingAs($owner)->get(route('empresa.edit', $team))->assertOk();

    $this->actingAs($owner)->patch(route('empresa.update', $team), [
        'nombre_empresa' => 'Llantas El Sol',
        'nit_empresa' => '900123456-1',
    ])->assertRedirect();

    $empresa = Empresa::firstOrFail();
    expect($empresa->nombre_empresa)->toBe('Llantas El Sol');
});

test('owners can update the existing company profile', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    Empresa::factory()->create(['nombre_empresa' => 'Nombre Original']);

    $this->actingAs($owner)->patch(route('empresa.update', $team), [
        'nombre_empresa' => 'Nombre Actualizado',
    ])->assertRedirect();

    expect(Empresa::count())->toBe(1);
    expect(Empresa::first()->nombre_empresa)->toBe('Nombre Actualizado');
});

test('members without permission cannot view or update the company profile', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');

    $this->actingAs($member)->get(route('empresa.edit', $team))->assertForbidden();

    $this->actingAs($member)->patch(route('empresa.update', $team), [
        'nombre_empresa' => 'Intento no autorizado',
    ])->assertForbidden();
});
