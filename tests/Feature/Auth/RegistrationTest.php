<?php

use App\Models\User;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();

    $user = User::where('email', 'test@example.com')->first();
    $response->assertRedirect(route('dashboard'));
});

test('the first registered user becomes administrator and the next ones get no role', function () {
    $datos = fn (string $email) => [
        'name' => 'Test User',
        'email' => $email,
        'password' => 'password',
        'password_confirmation' => 'password',
    ];

    $this->post(route('register.store'), $datos('primero@example.com'));
    $primero = User::where('email', 'primero@example.com')->firstOrFail();

    expect($primero->hasRole('Administrador'))->toBeTrue();
    expect($primero->can('roles.update'))->toBeTrue();

    auth()->logout();
    $this->post(route('register.store'), $datos('segundo@example.com'));

    expect(User::where('email', 'segundo@example.com')->firstOrFail()->roles)->toHaveCount(0);
});
