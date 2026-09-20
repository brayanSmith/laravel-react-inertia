<?php

use App\Models\InicioSesion;
use App\Models\Team;
use App\Models\User;
use App\Support\UserAgent;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('inicios-sesion.view');
});

test('logging in leaves a record with the browser, system and device', function () {
    $user = User::factory()->create();

    $this->withHeaders([
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ])->post(route('login.store'), ['email' => $user->email, 'password' => 'password']);

    $inicio = InicioSesion::firstOrFail();

    expect($inicio->user_id)->toBe($user->id)
        ->and($inicio->nombre)->toBe($user->name)
        ->and($inicio->email)->toBe($user->email)
        ->and($inicio->navegador)->toBe('Chrome')
        ->and($inicio->sistema_operativo)->toBe('Windows')
        ->and($inicio->dispositivo)->toBe('Escritorio');
});

test('a wrong password does not register a login', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), ['email' => $user->email, 'password' => 'wrong']);

    expect(InicioSesion::count())->toBe(0);
});

test('the user agent reader tells apart the common browsers and devices', function () {
    expect(UserAgent::parse('Mozilla/5.0 (Windows NT 10.0) Chrome/120 Edg/120 Safari/537'))
        ->toMatchArray(['navegador' => 'Edge', 'sistema_operativo' => 'Windows', 'dispositivo' => 'Escritorio']);

    expect(UserAgent::parse('Mozilla/5.0 (Linux; Android 14; Pixel) Chrome/120 Mobile Safari/537'))
        ->toMatchArray(['navegador' => 'Chrome', 'sistema_operativo' => 'Android', 'dispositivo' => 'Móvil']);

    expect(UserAgent::parse('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17 Mobile Safari/604'))
        ->toMatchArray(['navegador' => 'Safari', 'sistema_operativo' => 'iOS', 'dispositivo' => 'Móvil']);
});

test('the page lists only the logins of the team members, newest first', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $owner, 'Owner');

    $miembro = User::factory()->create();
    attachTeamMember($team, $miembro, 'Member');
    $ajeno = User::factory()->create();

    InicioSesion::factory()->create(['user_id' => $miembro->id, 'nombre' => 'Antiguo', 'created_at' => now()->subDay()]);
    InicioSesion::factory()->create(['user_id' => $owner->id, 'nombre' => 'Reciente', 'created_at' => now()]);
    InicioSesion::factory()->create(['user_id' => $ajeno->id, 'nombre' => 'De otro equipo']);

    $this->actingAs($owner)
        ->get(route('inicios-sesion.index', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('inicios-sesion/index')
            ->has('inicios', 2)
            ->where('inicios.0.nombre', 'Reciente')
            ->where('inicios.1.nombre', 'Antiguo')
        );
});

test('members without permission cannot view the logins', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $member, 'Member');

    $this->actingAs($member)->get(route('inicios-sesion.index', $team))->assertForbidden();

    $member->givePermissionTo('inicios-sesion.view');

    $this->actingAs($member)->get(route('inicios-sesion.index', $team))->assertOk();
});
