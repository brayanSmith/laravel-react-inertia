<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});

test('a profile picture can be uploaded, replaced and removed', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $datos = ['name' => $user->name, 'email' => $user->email];

    $this->actingAs($user)->patch(route('profile.update'), $datos + [
        'avatar' => UploadedFile::fake()->image('foto.png'),
    ])->assertSessionHasNoErrors();

    $primera = $user->fresh()->getRawOriginal('avatar');
    Storage::disk('public')->assertExists($primera);
    expect($user->fresh()->avatar)->toEndWith($primera);

    $this->actingAs($user)->patch(route('profile.update'), $datos + [
        'avatar' => UploadedFile::fake()->image('otra.png'),
    ]);

    Storage::disk('public')->assertMissing($primera);
    $segunda = $user->fresh()->getRawOriginal('avatar');
    Storage::disk('public')->assertExists($segunda);

    $this->actingAs($user)->patch(route('profile.update'), $datos + ['remove_avatar' => '1']);

    expect($user->fresh()->avatar)->toBeNull();
    Storage::disk('public')->assertMissing($segunda);
});

test('updating the profile without touching the picture keeps it', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)->patch(route('profile.update'), [
        'name' => $user->name,
        'email' => $user->email,
        'avatar' => UploadedFile::fake()->image('foto.png'),
    ]);
    $ruta = $user->fresh()->getRawOriginal('avatar');

    $this->actingAs($user)->patch(route('profile.update'), ['name' => 'Otro Nombre', 'email' => $user->email]);

    expect($user->fresh()->getRawOriginal('avatar'))->toBe($ruta);
    Storage::disk('public')->assertExists($ruta);
});

test('the profile picture must be an image', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)->patch(route('profile.update'), [
        'name' => $user->name,
        'email' => $user->email,
        'avatar' => UploadedFile::fake()->create('nota.pdf', 10, 'application/pdf'),
    ])->assertSessionHasErrors('avatar');
});
