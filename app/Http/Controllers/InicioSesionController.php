<?php

namespace App\Http\Controllers;

use App\Models\InicioSesion;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InicioSesionController extends Controller
{
    /**
     * The most recent logins of the current team's members.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('inicios-sesion.view');

        $team = Team::where('slug', $request->route('current_team'))->firstOrFail();

        return Inertia::render('inicios-sesion/index', [
            'inicios' => InicioSesion::whereIn('user_id', $team->members()->pluck('users.id'))
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->limit(2000)
                ->get(['id', 'nombre', 'email', 'ip', 'navegador', 'sistema_operativo', 'dispositivo', 'created_at']),
        ]);
    }
}
