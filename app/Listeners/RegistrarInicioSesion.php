<?php

namespace App\Listeners;

use App\Models\InicioSesion;
use App\Support\UserAgent;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;

/**
 * Leaves a record of every login (name, email, IP, browser, OS, device).
 * Discovered automatically by Laravel from the type-hint of `handle`.
 */
class RegistrarInicioSesion
{
    public function __construct(private Request $request) {}

    public function handle(Login $event): void
    {
        // Laravel also fires Login when it restores a session from the
        // "remember me" cookie, always on a GET; a real login (password,
        // two-factor challenge, passkey) is a POST.
        if (! $this->request->isMethod('POST')) {
            return;
        }

        $user = $event->user;
        $userAgent = $this->request->userAgent();

        InicioSesion::create([
            'user_id' => $user->getAuthIdentifier(),
            'nombre' => $user->name ?? '',
            'email' => $user->email ?? '',
            'ip' => $this->request->ip(),
            'user_agent' => $userAgent,
            ...UserAgent::parse($userAgent),
        ]);
    }
}
