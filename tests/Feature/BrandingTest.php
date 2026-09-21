<?php

use App\Models\Compra;
use App\Models\Empresa;
use App\Models\User;
use App\Support\Branding;

test('the app is branded with the company name and logo from Empresas', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('name', config('app.name'))
            ->where('logoUrl', null)
        )
        ->assertSee('/favicon.ico', false);

    Empresa::factory()->create(['nombre_empresa' => 'Llantas del Norte', 'logo_empresa' => 'empresa/logo.png']);
    app()->forgetInstance(Branding::class);

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('name', 'Llantas del Norte')
            ->where('logoUrl', '/storage/empresa/logo.png')
        )
        ->assertSee('/storage/empresa/logo.png', false)
        ->assertDontSee('/favicon.ico', false);
});

test('the sidebar counts the compras and how many are still pending', function () {
    $owner = User::factory()->create();
    asignarRol($owner, 'Owner');

    Compra::factory()->count(2)->create(['estado' => 'PENDIENTE']);
    Compra::factory()->create(['estado' => 'RECIBIDA']);

    $this->actingAs($owner)->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('navCounts.compras', 3)
            ->where('navCounts.comprasPendientes', 2)
        );
});
