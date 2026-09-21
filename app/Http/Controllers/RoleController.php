<?php

namespace App\Http\Controllers;

use App\Http\Requests\Roles\SaveRoleRequest;
use App\Http\Requests\Roles\UpdateMemberRolesRequest;
use App\Models\Bodega;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    /**
     * The roles with their permissions and bodegas, and who holds each one.
     */
    public function index(): Response
    {
        Gate::authorize('roles.view');

        return Inertia::render('roles/index', [
            'roles' => Role::query()
                ->with(['permissions', 'bodegas'])
                ->orderBy('name')
                ->get()
                ->map(fn (Role $role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name')->values(),
                    'bodegas' => $role->bodegas->pluck('id')->values(),
                ]),
            'permissions' => Permission::orderBy('name')->pluck('name'),
            'bodegas' => Bodega::orderBy('nombre_bodega')->get(['id', 'nombre_bodega']),
            'members' => User::query()->with('roles')->orderBy('name')->get()->map(fn (User $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'roles' => $member->roles->pluck('id')->values(),
                'tipos_precio_permitidos' => $member->tiposPrecioPermitidos(),
            ]),
            'permissionsFlags' => [
                'canCreate' => request()->user()->can('roles.create'),
                'canUpdate' => request()->user()->can('roles.update'),
                'canDelete' => request()->user()->can('roles.delete'),
            ],
        ]);
    }

    public function store(SaveRoleRequest $request): RedirectResponse
    {
        Gate::authorize('roles.create');

        $role = Role::create(['name' => $request->validated('name')]);

        $role->syncPermissions($request->validated('permissions', []));
        $role->bodegas()->sync($request->validated('bodegas', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role created.')]);

        return to_route('roles.index');
    }

    public function update(SaveRoleRequest $request, Role $role): RedirectResponse
    {
        Gate::authorize('roles.update');

        $role->update(['name' => $request->validated('name')]);
        $role->syncPermissions($request->validated('permissions', []));
        $role->bodegas()->sync($request->validated('bodegas', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role updated.')]);

        return to_route('roles.index');
    }

    public function destroy(Role $role): RedirectResponse
    {
        Gate::authorize('roles.delete');

        $role->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role deleted.')]);

        return to_route('roles.index');
    }

    /**
     * Replace the roles of one user.
     */
    public function updateMember(UpdateMemberRolesRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('roles.update');

        $user->syncRoles(Role::whereIn('id', $request->validated('roles', []))->get());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member roles updated.')]);

        return to_route('roles.index');
    }
}
