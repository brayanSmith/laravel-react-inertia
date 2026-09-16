<?php

use App\Models\Producto;
use App\Models\SubCategoria;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot access productos', function () {
    $team = Team::factory()->create();

    $response = $this->get(route('productos.index', $team));

    $response->assertRedirect(route('login'));
});

test('team members can view the productos index page', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    Producto::factory()->count(3)->create();

    $response = $this
        ->actingAs($user)
        ->get(route('productos.index', $team));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('productos/index')
        ->has('productos', 3),
    );
});

test('users who are not team members cannot view productos', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('productos.index', $team));

    $response->assertForbidden();
});

test('productos can be created', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);
    $subCategoria = SubCategoria::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('productos.store', $team), [
            'categoria_id' => $subCategoria->categoria_id,
            'sub_categoria_id' => $subCategoria->id,
            'codigo' => 'PRD-00001',
            'nombre' => 'Martillo',
            'descripcion' => 'Martillo de acero',
            'costo' => 10,
            'precio_detal' => 15,
            'precio_mayorista' => 12,
            'precio_especial' => 13,
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('productos', [
        'codigo' => 'PRD-00001',
        'nombre' => 'Martillo',
    ]);
});

test('producto creation requires a unique code', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    Producto::factory()->create(['codigo' => 'PRD-00001']);
    $subCategoria = SubCategoria::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('productos.store', $team), [
            'categoria_id' => $subCategoria->categoria_id,
            'sub_categoria_id' => $subCategoria->id,
            'codigo' => 'PRD-00001',
            'nombre' => 'Martillo',
            'costo' => 10,
            'precio_detal' => 15,
            'precio_mayorista' => 12,
            'precio_especial' => 13,
        ]);

    $response->assertSessionHasErrors('codigo');
});

test('productos can be updated', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $producto = Producto::factory()->create(['nombre' => 'Original']);

    $response = $this
        ->actingAs($user)
        ->patch(route('productos.update', ['current_team' => $team, 'producto' => $producto]), [
            'categoria_id' => $producto->categoria_id,
            'sub_categoria_id' => $producto->sub_categoria_id,
            'codigo' => $producto->codigo,
            'nombre' => 'Actualizado',
            'costo' => $producto->costo,
            'precio_detal' => $producto->precio_detal,
            'precio_mayorista' => $producto->precio_mayorista,
            'precio_especial' => $producto->precio_especial,
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('productos', [
        'id' => $producto->id,
        'nombre' => 'Actualizado',
    ]);
});

test('a producto can keep its own code when updated', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $producto = Producto::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('productos.update', ['current_team' => $team, 'producto' => $producto]), [
            'categoria_id' => $producto->categoria_id,
            'sub_categoria_id' => $producto->sub_categoria_id,
            'codigo' => $producto->codigo,
            'nombre' => $producto->nombre,
            'costo' => $producto->costo,
            'precio_detal' => $producto->precio_detal,
            'precio_mayorista' => $producto->precio_mayorista,
            'precio_especial' => $producto->precio_especial,
        ]);

    $response->assertSessionHasNoErrors();
});

test('a producto image can be uploaded when created', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $image = UploadedFile::fake()->image('producto.jpg');
    $subCategoria = SubCategoria::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('productos.store', $team), [
            'categoria_id' => $subCategoria->categoria_id,
            'sub_categoria_id' => $subCategoria->id,
            'codigo' => 'PRD-00001',
            'nombre' => 'Martillo',
            'costo' => 10,
            'precio_detal' => 15,
            'precio_mayorista' => 12,
            'precio_especial' => 13,
            'imagen' => $image,
        ]);

    $response->assertRedirect();

    $producto = Producto::where('codigo', 'PRD-00001')->firstOrFail();

    expect($producto->imagen)->not->toBeNull();
    Storage::disk('public')->assertExists($producto->imagen);
});

test('replacing a producto image removes the previous file', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $originalPath = UploadedFile::fake()->image('original.jpg')->store('productos', 'public');
    $producto = Producto::factory()->create(['imagen' => $originalPath]);

    $newImage = UploadedFile::fake()->image('new.jpg');

    $response = $this
        ->actingAs($user)
        ->patch(route('productos.update', ['current_team' => $team, 'producto' => $producto]), [
            'categoria_id' => $producto->categoria_id,
            'sub_categoria_id' => $producto->sub_categoria_id,
            'codigo' => $producto->codigo,
            'nombre' => $producto->nombre,
            'costo' => $producto->costo,
            'precio_detal' => $producto->precio_detal,
            'precio_mayorista' => $producto->precio_mayorista,
            'precio_especial' => $producto->precio_especial,
            'imagen' => $newImage,
        ]);

    $response->assertRedirect();

    Storage::disk('public')->assertMissing($originalPath);
    Storage::disk('public')->assertExists($producto->fresh()->imagen);
});

test('a producto image can be removed', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $path = UploadedFile::fake()->image('original.jpg')->store('productos', 'public');
    $producto = Producto::factory()->create(['imagen' => $path]);

    $response = $this
        ->actingAs($user)
        ->patch(route('productos.update', ['current_team' => $team, 'producto' => $producto]), [
            'categoria_id' => $producto->categoria_id,
            'sub_categoria_id' => $producto->sub_categoria_id,
            'codigo' => $producto->codigo,
            'nombre' => $producto->nombre,
            'costo' => $producto->costo,
            'precio_detal' => $producto->precio_detal,
            'precio_mayorista' => $producto->precio_mayorista,
            'precio_especial' => $producto->precio_especial,
            'remove_imagen' => '1',
        ]);

    $response->assertRedirect();

    Storage::disk('public')->assertMissing($path);

    $this->assertDatabaseHas('productos', [
        'id' => $producto->id,
        'imagen' => null,
    ]);
});

test('productos can be deleted', function () {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    attachTeamMember($team, $user);

    $producto = Producto::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('productos.destroy', ['current_team' => $team, 'producto' => $producto]));

    $response->assertRedirect();

    $this->assertSoftDeleted('productos', [
        'id' => $producto->id,
    ]);
});
