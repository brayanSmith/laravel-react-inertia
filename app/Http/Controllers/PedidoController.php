<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesTrash;
use App\Http\Requests\Pedidos\StorePedidoRequest;
use App\Http\Requests\Pedidos\UpdatePedidoRequest;
use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\DetallePedido;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Puc;
use App\Models\Team;
use App\Services\PedidoService;
use App\Services\PedidoVoucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Serves both the "pedidos" (DETAL) and "pedidos-mayoristas" (MAYORISTA)
 * modules. Which one is active is derived from the matched route's name
 * (e.g. "pedidos.index" vs "pedidos-mayoristas.index"), so both modules
 * share this one controller instead of duplicating it.
 */
class PedidoController extends Controller
{
    use HandlesTrash;

    /**
     * Display a listing of pedidos.
     */
    public function index(Request $request): Response
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.view");

        $eliminados = $this->verEliminados($request, $module);

        return Inertia::render("{$module}/index", [
            // Only the fields the listing shows: every pedido brings its lines,
            // products and payments, so whole models add up to megabytes.
            'pedidos' => Pedido::select([
                'id', 'fecha', 'estado', 'estado_pago', 'tipo_precio', 'turno', 'observacion', 'observacion_pago',
                'total_a_pagar', 'saldo_pendiente', 'descuento', 'reteica', 'retefuente', 'deleted_at',
                'cliente_id', 'bodega_id', 'user_id',
            ])
                ->with([
                    'cliente:id,razon_social,numero_documento',
                    'bodega:id,nombre_bodega',
                    'user:id,name',
                    'detalles' => fn ($query) => $query->withTrashed()
                        ->select(['id', 'pedido_id', 'producto_id', 'cantidad', 'precio_unitario', 'subtotal', 'costo_unitario', 'costo_total', 'ganancia_total'])
                        ->with(['producto' => fn ($query) => $query
                            ->select(['id', 'referencia_producto', 'concatenar_codigo_nombre', 'tipo_vehiculo'])
                            ->withSum('stockBodegas as stock_total', 'stock')]),
                    'abonos:id,pedido_id,puc_id',
                    'abonos.puc:id,concatenar_subcuenta_concepto',
                ])
                ->when($eliminados, fn ($query) => $query->onlyTrashed())
                ->where('tipo_precio', $this->tipoPrecio($module))
                ->orderByDesc('fecha')
                ->get(),
            'eliminados' => $eliminados,
            'permissions' => $this->permissions($request, $module),
        ]);
    }

    /**
     * Show the form for creating a new pedido.
     */
    public function create(Request $request): Response
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.create");

        return Inertia::render("{$module}/create", [
            ...$this->formData($request),
            'defaultTipoPrecio' => $this->tipoPrecio($module),
        ]);
    }

    /**
     * Store a newly created pedido.
     */
    public function store(StorePedidoRequest $request, PedidoService $pedidoService): RedirectResponse
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.create");

        $pedidoService->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pedido created.')]);

        return to_route("{$module}.index", ['current_team' => $request->route('current_team')]);
    }

    /**
     * The full detail of a pedido (header, lines and payments) as JSON, for
     * the read-only "ver" modal. Loaded on demand so the listing stays light.
     */
    public function show(Request $request, string $current_team, Pedido $pedido): JsonResponse
    {
        Gate::authorize($this->module($request).'.view');

        $pedido->load([
            'cliente:id,razon_social,tipo_documento,numero_documento,telefono,ciudad,email,direccion',
            'bodega:id,nombre_bodega',
            'user:id,name',
            'detalles' => fn ($query) => $query->withTrashed()
                ->with(['producto:id,referencia_producto,concatenar_codigo_nombre', 'bodega:id,nombre_bodega']),
            'abonos' => fn ($query) => $query->with(['puc:id,concatenar_subcuenta_concepto', 'vendedor:id,name']),
        ]);

        // What the pedido cost and earned is not for this view.
        $pedido->detalles->each->makeHidden(['costo_unitario', 'costo_total', 'ganancia_total']);

        return response()->json($pedido);
    }

    /**
     * The data of a pedido's payment voucher (the PDF itself is rendered in
     * the browser), for the "voucher" button of the listing and the modal.
     */
    public function voucher(Request $request, string $current_team, Pedido $pedido, PedidoVoucher $voucher): JsonResponse
    {
        Gate::authorize($this->module($request).'.view');

        return response()->json($voucher->toArray($pedido));
    }

    /**
     * Show the form for editing the specified pedido.
     */
    public function edit(Request $request, string $current_team, Pedido $pedido): Response
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.update");

        return Inertia::render("{$module}/edit", [
            'pedido' => $pedido->load([
                'cliente',
                'detalles.producto',
                'abonos.puc',
                'abonos.vendedor',
                'user',
                'bodega',
            ]),
            ...$this->formData($request),
            'permissions' => ['canDelete' => $request->user()->can("{$module}.delete")],
        ]);
    }

    /**
     * Update the specified pedido.
     */
    public function update(UpdatePedidoRequest $request, PedidoService $pedidoService, string $current_team, Pedido $pedido): RedirectResponse
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.update");

        $data = $request->validated();

        DB::transaction(function () use ($pedido, $data, $pedidoService): void {
            foreach ($pedido->detalles as $detalle) {
                $pedidoService->adjustStock($detalle, $pedido, 1);
            }

            $pedido->detalles()->forceDelete();

            $pedido->update([
                'cliente_id' => $data['cliente_id'],
                'fecha' => $data['fecha'],
                'user_id' => $data['user_id'],
                'bodega_id' => $data['bodega_id'],
                'tipo_precio' => $data['tipo_precio'],
                'placa' => $data['placa'] ?? null,
                'facturacion_electronica' => $data['facturacion_electronica'] ?? false,
                'observacion' => $data['observacion'] ?? null,
                'observacion_pago' => $data['observacion_pago'] ?? null,
                'flete' => $data['flete'] ?? 0,
                'descuento' => $data['descuento'] ?? 0,
                'reteica' => $data['reteica'] ?? 0,
                'retefuente' => $data['retefuente'] ?? 0,
            ]);

            $pedidoService->syncDetalles($pedido, $data['detalles']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pedido updated.')]);

        return to_route("{$module}.edit", ['current_team' => $current_team, 'pedido' => $pedido]);
    }

    /**
     * Remove the specified pedido.
     */
    public function destroy(Request $request, PedidoService $pedidoService, string $current_team, Pedido $pedido): RedirectResponse
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.delete");

        DB::transaction(function () use ($pedido, $pedidoService): void {
            foreach ($pedido->detalles as $detalle) {
                $pedidoService->adjustStock($detalle, $pedido, 1);
            }

            $pedido->detalles()->delete();
            $pedido->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pedido deleted.')]);

        return to_route("{$module}.index", ['current_team' => $current_team]);
    }

    /**
     * @return array{clientes: Collection, productos: Collection, bodegas: Collection, vendedores: Collection, pucs: Collection}
     */
    private function formData(Request $request): array
    {
        $team = Team::where('slug', $request->route('current_team'))->firstOrFail();

        return [
            'clientes' => Cliente::orderBy('razon_social')->get([
                'id', 'tipo_documento', 'numero_documento', 'razon_social', 'direccion', 'telefono', 'ciudad', 'email',
            ]),
            'productos' => Producto::where('categoria', '!=', 'SERVICIO')
                ->where('inventariable', true)
                ->orderBy('referencia_producto')
                ->get(['id', 'referencia_producto', 'concatenar_codigo_nombre', 'valor_detal', 'valor_mayorista', 'costo_producto']),
            'bodegas' => Bodega::orderBy('nombre_bodega')->get(['id', 'nombre_bodega']),
            'vendedores' => $team->members()->get(['users.id', 'users.name']),
            'pucs' => Puc::orderBy('concatenar_subcuenta_concepto')->get(['id', 'concatenar_subcuenta_concepto']),
        ];
    }

    /**
     * @return array{canCreate: bool, canUpdate: bool, canDelete: bool}
     */
    private function permissions(Request $request, string $module): array
    {
        return [
            'canCreate' => $request->user()->can("{$module}.create"),
            'canUpdate' => $request->user()->can("{$module}.update"),
            'canDelete' => $request->user()->can("{$module}.delete"),
        ];
    }

    /**
     * The active module ("pedidos" or "pedidos-mayoristas"), derived from
     * the matched route's name (e.g. "pedidos-mayoristas.index").
     */
    private function module(Request $request): string
    {
        return Str::before($request->route()->getName(), '.');
    }

    /**
     * The tipo_precio this module is scoped to.
     */
    private function tipoPrecio(string $module): string
    {
        return $module === 'pedidos-mayoristas' ? 'MAYORISTA' : 'DETAL';
    }

    /**
     * Restore a deleted pedido with its lines, taking their stock out of
     * the bodega again.
     */
    public function restore(Request $request, PedidoService $pedidoService, string $current_team, Pedido $pedido): RedirectResponse
    {
        return $this->restaurarRegistro($this->module($request), $pedido, __('Pedido restored.'), function (Pedido $pedido) use ($pedidoService): void {
            DB::transaction(function () use ($pedido, $pedidoService): void {
                $pedido->detalles()->onlyTrashed()->get()->each(function (DetallePedido $detalle) use ($pedido, $pedidoService): void {
                    $detalle->restore();
                    $pedidoService->adjustStock($detalle, $pedido, -1);
                });
            });
        });
    }
}
