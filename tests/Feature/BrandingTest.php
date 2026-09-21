<?php

use App\Models\Empresa;
use App\Models\Team;
use App\Models\User;
use App\Support\Branding;

test('the app is branded with the company name and logo from Empresas', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    $this->actingAs($owner)
        ->get(route('dashboard', $team))
        ->assertInertia(fn ($page) => $page
            ->where('name', config('app.name'))
            ->where('logoUrl', null)
        )
        ->assertSee('/favicon.ico', false);

    Empresa::factory()->create(['nombre_empresa' => 'Llantas del Norte', 'logo_empresa' => 'empresa/logo.png']);
    app()->forgetInstance(Branding::class);

    $this->actingAs($owner)
        ->get(route('dashboard', $team))
        ->assertInertia(fn ($page) => $page
            ->where('name', 'Llantas del Norte')
            ->where('logoUrl', '/storage/empresa/logo.png')
        )
        ->assertSee('/storage/empresa/logo.png', false)
        ->assertDontSee('/favicon.ico', false);
});
