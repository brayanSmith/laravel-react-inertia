<?php

namespace App\Http\Controllers;

use App\Models\InicioSesion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InicioSesionController extends Controller
{
    /**
     * The most recent logins.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('inicios-sesion.view');

        return Inertia::render('inicios-sesion/index', [
            'inicios' => InicioSesion::query()
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->limit(2000)
                ->get(['id', 'nombre', 'email', 'ip', 'navegador', 'sistema_operativo', 'dispositivo', 'created_at']),
        ]);
    }
}
