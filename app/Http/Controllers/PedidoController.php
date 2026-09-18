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
use Inertia\Inertia;
use Inertia\Response;

class PedidoController extends Controller
{
    /**
     * Display a listing of pedidos.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('pedidos.view');

        return Inertia::render('pedidos/index', [
            'pedidos' => Pedido::with(['cliente', 'bodega', 'user', 'detalles.producto', 'abonos.puc'])
                ->orderByDesc('fecha')
                ->get(),
            'permissions' => $this->permissions($request),
        ]);
    }

    /**
     * Show the form for creating a new pedido.
     */
    public function create(Request $request): Response
    {
        Gate::authorize('pedidos.create');

        return Inertia::render('pedidos/create', $this->formData($request));
    }

    /**
     * Store a newly created pedido.
     */
    public function store(StorePedidoRequest $request): RedirectResponse
    {
        Gate::authorize('pedidos.create');

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

        return to_route('pedidos.index', ['current_team' => $request->route('current_team')]);
    }

    /**
     * Show the form for editing the specified pedido.
     */
    public function edit(Request $request, string $current_team, Pedido $pedido): Response
    {
        Gate::authorize('pedidos.update');

        return Inertia::render('pedidos/edit', [
            'pedido' => $pedido->load([
                'cliente',
                'detalles.producto',
                'abonos.puc',
                'abonos.vendedor',
                'user',
                'bodega',
            ]),
            ...$this->formData($request),
            'permissions' => ['canDelete' => $request->user()->can('pedidos.delete')],
        ]);
    }

    /**
     * Update the specified pedido.
     */
    public function update(UpdatePedidoRequest $request, string $current_team, Pedido $pedido): RedirectResponse
    {
        Gate::authorize('pedidos.update');

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

        return to_route('pedidos.edit', ['current_team' => $current_team, 'pedido' => $pedido]);
    }

    /**
     * Remove the specified pedido.
     */
    public function destroy(string $current_team, Pedido $pedido): RedirectResponse
    {
        Gate::authorize('pedidos.delete');

        DB::transaction(function () use ($pedido): void {
            foreach ($pedido->detalles as $detalle) {
                $this->adjustStock($detalle, $pedido, 1);
            }

            $pedido->detalles()->delete();
            $pedido->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pedido deleted.')]);

        return to_route('pedidos.index', ['current_team' => $current_team]);
    }

    /**
     * Replace the pedido's detalles, recomputing totals and warehouse stock.
     *
     * @param  array<int, array{producto_id: int, cantidad: float|string, precio_unitario: float|string}>  $detalles
     */
    private function syncDetalles(Pedido $pedido, array $detalles): void
    {
        $subtotal = 0;

        foreach ($detalles as $item) {
            $cantidad = (float) $item['cantidad'];
            $precioUnitario = (float) $item['precio_unitario'];
            $itemSubtotal = $cantidad * $precioUnitario;
            $subtotal += $itemSubtotal;

            $detalle = $pedido->detalles()->create([
                'producto_id' => $item['producto_id'],
                'cantidad' => $cantidad,
                'precio_unitario' => $precioUnitario,
                'subtotal' => $itemSubtotal,
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
    private function permissions(Request $request): array
    {
        return [
            'canCreate' => $request->user()->can('pedidos.create'),
            'canUpdate' => $request->user()->can('pedidos.update'),
            'canDelete' => $request->user()->can('pedidos.delete'),
        ];
    }
}
