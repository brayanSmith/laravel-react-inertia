<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user?->toUserTeams(includeCurrent: true) ?? [],
            'canViewClientes' => fn () => $user?->can('clientes.view') ?? false,
            'canViewUsuarios' => fn () => $user?->can('usuarios.view') ?? false,
            'canViewBodegas' => fn () => $user?->can('bodegas.view') ?? false,
            'canViewProveedores' => fn () => $user?->can('proveedores.view') ?? false,
            'canViewMarcas' => fn () => $user?->can('marcas.view') ?? false,
            'canViewPucs' => fn () => $user?->can('puc.view') ?? false,
            'canViewEmpresa' => fn () => $user?->can('empresa.view') ?? false,
            'canViewGastos' => fn () => $user?->can('gastos.view') ?? false,
            'canViewCompras' => fn () => $user?->can('compras.view') ?? false,
            'canViewPedidos' => fn () => $user?->can('pedidos.view') ?? false,
            'canViewProductos' => fn () => $user?->can('productos.view') ?? false,
            'canViewStockIniciales' => fn () => $user?->can('stock-iniciales.view') ?? false,
            'canViewStockBodegas' => fn () => $user?->can('stock-bodegas.view') ?? false,
            'canViewTraslados' => fn () => $user?->can('traslados.view') ?? false,
        ];
    }
}
