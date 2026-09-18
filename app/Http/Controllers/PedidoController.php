<?php

namespace App\Http\Controllers;

use App\Http\Requests\Pedidos\StorePedidoRequest;
use App\Http\Requests\Pedidos\UpdatePedidoRequest;
use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\DetallePedido;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Puc;
use App\Models\StockBodega;
use App\Models\Team;
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
    /**
     * Display a listing of pedidos.
     */
    public function index(Request $request): Response
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.view");

        return Inertia::render("{$module}/index", [
            'pedidos' => Pedido::with([
                'cliente',
                'bodega',
                'user',
                'detalles.producto.stockBodegas',
                'abonos.puc',
            ])
                ->where('tipo_precio', $this->tipoPrecio($module))
                ->orderByDesc('fecha')
                ->get(),
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
    public function store(StorePedidoRequest $request): RedirectResponse
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.create");

        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $pedido = Pedido::create([
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
                'subtotal' => 0,
                'total_a_pagar' => 0,
            ]);

            $this->syncDetalles($pedido, $data['detalles']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pedido created.')]);

        return to_route("{$module}.index", ['current_team' => $request->route('current_team')]);
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
    public function update(UpdatePedidoRequest $request, string $current_team, Pedido $pedido): RedirectResponse
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.update");

        $data = $request->validated();

        DB::transaction(function () use ($pedido, $data): void {
            foreach ($pedido->detalles as $detalle) {
                $this->adjustStock($detalle, $pedido, 1);
            }

            $pedido->detalles()->delete();

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

            $this->syncDetalles($pedido, $data['detalles']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pedido updated.')]);

        return to_route("{$module}.edit", ['current_team' => $current_team, 'pedido' => $pedido]);
    }

    /**
     * Remove the specified pedido.
     */
    public function destroy(Request $request, string $current_team, Pedido $pedido): RedirectResponse
    {
        $module = $this->module($request);

        Gate::authorize("{$module}.delete");

        DB::transaction(function () use ($pedido): void {
            foreach ($pedido->detalles as $detalle) {
                $this->adjustStock($detalle, $pedido, 1);
            }

            $pedido->detalles()->delete();
            $pedido->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pedido deleted.')]);

        return to_route("{$module}.index", ['current_team' => $current_team]);
    }

    /**
     * Replace the pedido's detalles, recomputing totals and warehouse stock.
     *
     * @param  array<int, array{producto_id: int, cantidad: float|string, precio_unitario: float|string}>  $detalles
     */
    private function syncDetalles(Pedido $pedido, array $detalles): void
    {
        $subtotal = 0;

        $productos = Producto::whereIn('id', array_column($detalles, 'producto_id'))
            ->get(['id', 'costo_producto'])
            ->keyBy('id');

        foreach ($detalles as $item) {
            $cantidad = (float) $item['cantidad'];
            $precioUnitario = (float) $item['precio_unitario'];
            $itemSubtotal = $cantidad * $precioUnitario;
            $subtotal += $itemSubtotal;

            $costoUnitario = (float) ($productos->get($item['producto_id'])?->costo_producto ?? 0);
            $costoTotal = $costoUnitario * $cantidad;

            $detalle = $pedido->detalles()->create([
                'producto_id' => $item['producto_id'],
                'cantidad' => $cantidad,
                'precio_unitario' => $precioUnitario,
                'subtotal' => $itemSubtotal,
                'costo_unitario' => $costoUnitario,
                'costo_total' => $costoTotal,
                'ganancia_total' => $itemSubtotal - $costoTotal,
            ]);

            $this->adjustStock($detalle, $pedido, -1);
        }

        $descuento = (float) $pedido->descuento;
        $flete = (float) $pedido->flete;
        $reteica = (float) $pedido->reteica;
        $retefuente = (float) $pedido->retefuente;

        $pedido->update([
            'subtotal' => $subtotal,
            'total_a_pagar' => max($subtotal + $flete - $descuento - $reteica - $retefuente, 0),
        ]);

        $pedido->recalcularTotales();
    }

    /**
     * Apply (or revert) a detalle's quantity to the pedido's warehouse stock.
     */
    private function adjustStock(DetallePedido $detalle, Pedido $pedido, int $sign): void
    {
        $stockBodega = StockBodega::firstOrNew([
            'bodega_id' => $pedido->bodega_id,
            'producto_id' => $detalle->producto_id,
        ]);

        $cantidad = (float) $detalle->cantidad;

        $stockBodega->salidas = (float) ($stockBodega->salidas ?? 0) + ($sign < 0 ? $cantidad : 0);
        $stockBodega->stock = (float) ($stockBodega->stock ?? 0) + $sign * $cantidad;
        $stockBodega->save();
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
}
