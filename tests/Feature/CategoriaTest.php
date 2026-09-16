<?php

use App\Models\Categoria;
use App\Models\SubCategoria;
use App\Models\Team;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot access categorias', function () {
    $team = Team::factory()->create();

    $response = $this->get(route('categorias.index', $team));

    $response->assertRedirect(route('login'));
});

test('team members can view the categorias index page', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    Categoria::factory()->count(3)->create();

    $response = $this
        ->actingAs($user)
        ->get(route('categorias.index', $team));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('categorias/index')
        ->has('categorias', 3),
    );
});

test('users who are not team members cannot view categorias', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('categorias.index', $team));

    $response->assertForbidden();
});

test('categorias can be created', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $response = $this
        ->actingAs($user)
        ->post(route('categorias.store', $team), [
            'nombre' => 'Herramientas',
            'descripcion' => 'Herramientas de mano',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('categorias', [
        'nombre' => 'Herramientas',
    ]);
});

test('the categorias index page includes each categoria subcategorias', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $categoria = Categoria::factory()->create();
    SubCategoria::factory()->count(2)->create(['categoria_id' => $categoria->id]);

    $response = $this
        ->actingAs($user)
        ->get(route('categorias.index', $team));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('categorias/index')
        ->has('categorias.0.sub_categorias', 2),
    );
});

test('categorias can be updated', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $categoria = Categoria::factory()->create(['nombre' => 'Original']);

    $response = $this
        ->actingAs($user)
        ->patch(route('categorias.update', ['current_team' => $team, 'categoria' => $categoria]), [
            'nombre' => 'Actualizada',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('categorias', [
        'id' => $categoria->id,
        'nombre' => 'Actualizada',
    ]);
});

test('categorias can be deleted', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $categoria = Categoria::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('categorias.destroy', ['current_team' => $team, 'categoria' => $categoria]));

    $response->assertRedirect();

    $this->assertSoftDeleted('categorias', [
        'id' => $categoria->id,
    ]);
});

test('subcategorias can be created for a categoria', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $categoria = Categoria::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('categorias.subcategorias.store', ['current_team' => $team, 'categoria' => $categoria]), [
            'nombre' => 'Destornilladores',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('sub_categorias', [
        'categoria_id' => $categoria->id,
        'nombre' => 'Destornilladores',
    ]);
});

test('subcategorias can be updated', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $categoria = Categoria::factory()->create();
    $subCategoria = SubCategoria::factory()->create([
        'categoria_id' => $categoria->id,
        'nombre' => 'Original',
    ]);

    $response = $this
        ->actingAs($user)
        ->patch(route('categorias.subcategorias.update', [
            'current_team' => $team,
            'categoria' => $categoria,
            'subcategoria' => $subCategoria,
        ]), [
            'nombre' => 'Actualizada',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('sub_categorias', [
        'id' => $subCategoria->id,
        'nombre' => 'Actualizada',
    ]);
});

test('subcategorias can be deleted', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $categoria = Categoria::factory()->create();
    $subCategoria = SubCategoria::factory()->create(['categoria_id' => $categoria->id]);

    $response = $this
        ->actingAs($user)
        ->delete(route('categorias.subcategorias.destroy', [
            'current_team' => $team,
            'categoria' => $categoria,
            'subcategoria' => $subCategoria,
        ]));

    $response->assertRedirect();

    $this->assertSoftDeleted('sub_categorias', [
        'id' => $subCategoria->id,
    ]);
});
