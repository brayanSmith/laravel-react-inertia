<?php

namespace App\Http\Middleware;

use App\Models\Compra;
use App\Models\Pedido;
use App\Models\User;
use App\Support\Branding;
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
            // The app is branded with the company saved in "Empresas".
            'name' => fn () => app(Branding::class)->name(),
            'logoUrl' => fn () => app(Branding::class)->logoUrl(),
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
            'canViewCotizador' => fn () => $user?->can('cotizador.view') ?? false,
            'canViewPos' => fn () => $user?->can('pos.view') ?? false,
            'canViewCompras' => fn () => $user?->can('compras.view') ?? false,
            'canViewPedidos' => fn () => $user?->can('pedidos.view') ?? false,
            'canViewPedidosMayoristas' => fn () => $user?->can('pedidos-mayoristas.view') ?? false,
            'canViewProductos' => fn () => $user?->can('productos.view') ?? false,
            'canViewStockIniciales' => fn () => $user?->can('stock-iniciales.view') ?? false,
            'canViewStockBodegas' => fn () => $user?->can('stock-bodegas.view') ?? false,
            'canViewTraslados' => fn () => $user?->can('traslados.view') ?? false,
            'canViewIniciosSesion' => fn () => $user?->can('inicios-sesion.view') ?? false,
            'navCounts' => fn () => $this->navCounts($user),
        ];
    }

    /**
     * The totals shown as badges in the sidebar: every pedido of each module
     * (DETAL / MAYORISTA) and every compra, so the badge matches what the
     * listing shows. A count is only computed for the modules the user can
     * open.
     *
     * @return array{pedidos: int, pedidosMayoristas: int, compras: int}
     */
    private function navCounts(?User $user): array
    {
        return [
            'pedidos' => $user?->can('pedidos.view')
                ? Pedido::where('tipo_precio', 'DETAL')->count()
                : 0,
            'pedidosMayoristas' => $user?->can('pedidos-mayoristas.view')
                ? Pedido::where('tipo_precio', 'MAYORISTA')->count()
                : 0,
            'compras' => $user?->can('compras.view')
                ? Compra::count()
                : 0,
        ];
    }
}
