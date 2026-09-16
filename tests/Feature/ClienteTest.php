<?php

use App\Models\Cliente;
use App\Models\Team;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot access clientes', function () {
    $team = Team::factory()->create();

    $response = $this->get(route('clientes.index', $team));

    $response->assertRedirect(route('login'));
});

test('team members can view the clientes index page', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    Cliente::factory()->count(3)->create();

    $response = $this
        ->actingAs($user)
        ->get(route('clientes.index', $team));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('clientes/index')
        ->has('clientes', 3),
    );
});

test('users who are not team members cannot view clientes', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('clientes.index', $team));

    $response->assertForbidden();
});

test('clientes can be created', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $response = $this
        ->actingAs($user)
        ->post(route('clientes.store', $team), [
            'nombre' => 'Juan',
            'apellido' => 'Pérez',
            'n_documento' => '12345678',
            'direccion' => 'Calle Falsa 123',
            'email' => 'juan@example.com',
            'telefono' => '5555-5555',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('clientes', [
        'nombre' => 'Juan',
        'apellido' => 'Pérez',
        'n_documento' => '12345678',
        'email' => 'juan@example.com',
    ]);
});

test('cliente creation requires a unique document number', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    Cliente::factory()->create(['n_documento' => '12345678']);

    $response = $this
        ->actingAs($user)
        ->post(route('clientes.store', $team), [
            'nombre' => 'Juan',
            'apellido' => 'Pérez',
            'n_documento' => '12345678',
            'email' => 'otro@example.com',
        ]);

    $response->assertSessionHasErrors('n_documento');
});

test('cliente creation requires a unique email', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    Cliente::factory()->create(['email' => 'juan@example.com']);

    $response = $this
        ->actingAs($user)
        ->post(route('clientes.store', $team), [
            'nombre' => 'Juan',
            'apellido' => 'Pérez',
            'n_documento' => '87654321',
            'email' => 'juan@example.com',
        ]);

    $response->assertSessionHasErrors('email');
});

test('clientes can be updated', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $cliente = Cliente::factory()->create(['nombre' => 'Original']);

    $response = $this
        ->actingAs($user)
        ->patch(route('clientes.update', ['current_team' => $team, 'cliente' => $cliente]), [
            'nombre' => 'Actualizado',
            'apellido' => $cliente->apellido,
            'n_documento' => $cliente->n_documento,
            'email' => $cliente->email,
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('clientes', [
        'id' => $cliente->id,
        'nombre' => 'Actualizado',
    ]);
});

test('a cliente can keep its own document number and email when updated', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $cliente = Cliente::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('clientes.update', ['current_team' => $team, 'cliente' => $cliente]), [
            'nombre' => $cliente->nombre,
            'apellido' => $cliente->apellido,
            'n_documento' => $cliente->n_documento,
            'email' => $cliente->email,
        ]);

    $response->assertSessionHasNoErrors();
});

test('clientes can be deleted', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $cliente = Cliente::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('clientes.destroy', ['current_team' => $team, 'cliente' => $cliente]));

    $response->assertRedirect();

    $this->assertSoftDeleted('clientes', [
        'id' => $cliente->id,
    ]);
});
