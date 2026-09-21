<?php

namespace App\Http\Controllers;

use App\Http\Requests\Usuarios\StoreUsuarioRequest;
use App\Http\Requests\Usuarios\UpdateUsuarioRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UsuarioController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('usuarios.view');

        return Inertia::render('usuarios/index', [
            'usuarios' => User::query()->with('roles')->orderBy('name')->get()->map(fn (User $usuario) => [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'email' => $usuario->email,
                'roles' => $usuario->roles->pluck('id')->values(),
                'tipos_precio_permitidos' => $usuario->tiposPrecioPermitidos(),
            ]),
            'availableRoles' => Role::orderBy('name')->get(['id', 'name']),
            'permissions' => [
                'canCreate' => $request->user()->can('usuarios.create'),
                'canUpdate' => $request->user()->can('usuarios.update'),
                'canDelete' => $request->user()->can('usuarios.delete'),
            ],
        ]);
    }

    /**
     * Create a new user with the given roles.
     */
    public function store(StoreUsuarioRequest $request): RedirectResponse
    {
        Gate::authorize('usuarios.create');

        DB::transaction(function () use ($request) {
            $usuario = User::create([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'password' => $request->validated('password'),
                'tipos_precio_permitidos' => $request->validated('tipos_precio_permitidos'),
            ]);

            $usuario->forceFill(['email_verified_at' => now()])->save();
            $usuario->syncRoles(Role::whereIn('id', $request->validated('roles', []))->get());
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Usuario created.')]);

        return back();
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUsuarioRequest $request, User $usuario): RedirectResponse
    {
        Gate::authorize('usuarios.update');

        DB::transaction(function () use ($request, $usuario) {
            $data = [
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'tipos_precio_permitidos' => $request->validated('tipos_precio_permitidos'),
            ];

            if ($password = $request->validated('password')) {
                $data['password'] = $password;
            }

            $usuario->update($data);
            $usuario->syncRoles(Role::whereIn('id', $request->validated('roles', []))->get());
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Usuario updated.')]);

        return back();
    }

    /**
     * Change only the prices a user may see and use (inline edit from the
     * users and roles tables).
     */
    public function updatePrecios(Request $request, User $usuario): RedirectResponse
    {
        abort_unless($request->user()->can('usuarios.update') || $request->user()->can('roles.update'), 403);

        $data = $request->validate([
            'tipos_precio_permitidos' => ['required', 'array', 'min:1'],
            'tipos_precio_permitidos.*' => ['string', 'in:'.implode(',', User::TIPOS_PRECIO)],
        ]);

        $usuario->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Usuario updated.')]);

        return back();
    }

    /**
     * Delete the specified user (never yourself).
     */
    public function destroy(Request $request, User $usuario): RedirectResponse
    {
        Gate::authorize('usuarios.delete');

        abort_if($request->user()->is($usuario), 403, __('You cannot delete your own user.'));

        $usuario->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Usuario removed.')]);

        return back();
    }
}
