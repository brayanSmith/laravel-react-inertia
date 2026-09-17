<?php

use App\Enums\TeamRole;
use App\Models\Marca;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::findOrCreate('marcas.view');
    Permission::findOrCreate('marcas.create');
    Permission::findOrCreate('marcas.update');
    Permission::findOrCreate('marcas.delete');
});

test('owners can view, create, update and delete marcas without a custom role', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);

    $this->actingAs($owner)->get(route('marcas.index', $team))->assertOk();

    $this->actingAs($owner)->post(route('marcas.store', $team), [
        'marca' => 'Marca Uno',
        'descripcion_marca' => 'Descripción',
    ])->assertRedirect();

    $marca = Marca::firstOrFail();

    $this->actingAs($owner)->patch(route('marcas.update', [$team, $marca]), [
        'marca' => 'Marca Actualizada',
    ])->assertRedirect();

    expect($marca->fresh()->marca)->toBe('Marca Actualizada');

    $this->actingAs($owner)->delete(route('marcas.destroy', [$team, $marca]))
        ->assertRedirect();

    expect(Marca::find($marca->id))->toBeNull();
});

test('members without permission cannot view marcas', function () {
    $member = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);

    $this->actingAs($member)->get(route('marcas.index', $team))->assertForbidden();
});

test('marca name must be unique', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);

    Marca::factory()->create(['marca' => 'Marca Norte']);

    $this->actingAs($owner)->post(route('marcas.store', $team), [
        'marca' => 'Marca Norte',
    ])->assertSessionHasErrors('marca');
});

test('a marca with associated products cannot be deleted', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);

    $marca = Marca::factory()->create();

    DB::table('productos')->insert([
        'marca_id' => $marca->id,
        'referencia_producto' => 'REF-1',
        'created_at' => now(), 'updated_at' => now(),
    ]);

    $response = $this->actingAs($owner)->delete(route('marcas.destroy', [$team, $marca]));

    $response->assertRedirect();
    expect(Marca::find($marca->id))->not->toBeNull();
});
