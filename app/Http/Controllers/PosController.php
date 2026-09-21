<?php

namespace App\Http\Controllers;

use App\Http\Requests\Pedidos\StorePedidoRequest;
use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\Marca;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Puc;
use App\Models\User;
use App\Services\PedidoService;
use App\Services\PedidoVoucher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Standalone point-of-sale screen: a product catalog to click through and a
 * checkout panel that creates a pedido. Order creation itself is delegated
 * to {@see PedidoService}, shared with the pedidos modules.
 */
class PosController extends Controller
{
    /**
     * Display the POS screen.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('pos.view');

        return Inertia::render('pos/index', [
            'clientes' => Cliente::orderBy('razon_social')->get([
                'id', 'tipo_documento', 'numero_documento', 'razon_social', 'direccion', 'telefono', 'ciudad', 'email',
            ]),
            'productos' => $this->catalogoProductos(),
            'bodegas' => Bodega::permitidas()->orderBy('nombre_bodega')->get(['id', 'nombre_bodega']),
            'vendedores' => User::orderBy('name')->get(['id', 'name']),
            'pucs' => Puc::orderBy('concatenar_subcuenta_concepto')->get(['id', 'concatenar_subcuenta_concepto']),
            'marcas' => Marca::orderBy('marca')->get(['id', 'marca']),
            'canCreateProducto' => $request->user()->can('pos.create-producto'),
            'canCreateCliente' => $request->user()->can('pos.create-cliente'),
            'canViewAllPedidos' => $request->user()->can('pos.view-all-pedidos'),
        ]);
    }

    /**
     * Create a pedido from the POS checkout and stay on the POS screen.
     */
    public function store(StorePedidoRequest $request, PedidoService $pedidoService, PedidoVoucher $voucher): RedirectResponse
    {
        Gate::authorize('pos.create');

        $pedido = $pedidoService->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pedido created.')]);
        Inertia::flash('pedido_creado', $voucher->toArray($pedido));

        return to_route('pos.index');
    }

    /**
     * A cliente's pedidos, newest first, optionally limited to a date range
     * (`desde` / `hasta`, inclusive) — the POS history modal, so nobody has
     * to leave the POS to look a customer's orders up.
     */
    public function clientePedidos(Request $request, Cliente $cliente): JsonResponse
    {
        Gate::authorize('pos.view');

        $filters = $request->validate([
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date'],
        ]);

        return response()->json($this->historial(Pedido::where('cliente_id', $cliente->id), $filters, $request));
    }

    /**
     * Every pedido, newest first, optionally limited to a date range and to
     * one vendedor (`user_id`) — the POS "historial de pedidos" modal.
     */
    public function pedidos(Request $request): JsonResponse
    {
        Gate::authorize('pos.view');

        $filters = $request->validate([
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        return response()->json($this->historial(Pedido::query(), $filters, $request));
    }

    /**
     * The data of a pedido's payment voucher, so the history can download it
     * again (the PDF itself is rendered in the browser).
     */
    public function voucher(Request $request, Pedido $pedido, PedidoVoucher $voucher): JsonResponse
    {
        Gate::authorize('pos.view');

        // Without `pos.view-all-pedidos` only the user's own pedidos.
        abort_unless(
            $request->user()->can('pos.view-all-pedidos') || $pedido->user_id === $request->user()->id,
            403,
        );

        return response()->json($voucher->toArray($pedido));
    }

    /**
     * Applies the shared history filters to a pedidos query and returns one
     * page of rows shaped for the POS history modals.
     *
     * @param  Builder<Pedido>  $query
     * @param  array<string, mixed>  $filters
     */
    private function historial(Builder $query, array $filters, Request $request): LengthAwarePaginator
    {
        // Without `pos.view-all-pedidos` the history is only the user's own pedidos.
        if (! $request->user()->can('pos.view-all-pedidos')) {
            $filters['user_id'] = $request->user()->id;
        }

        return $query
            ->when($filters['desde'] ?? null, fn ($query, $desde) => $query->where('fecha', '>=', Carbon::parse($desde, 'America/Bogota')->startOfDay()->utc()))
            ->when($filters['hasta'] ?? null, fn ($query, $hasta) => $query->where('fecha', '<=', Carbon::parse($hasta, 'America/Bogota')->endOfDay()->utc()))
            ->when($filters['user_id'] ?? null, fn ($query, $userId) => $query->where('user_id', $userId))
            ->with([
                'cliente:id,razon_social',
                'user:id,name',
                'detalles.producto:id,concatenar_codigo_nombre,referencia_producto',
            ])
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->paginate(10)
            ->through(fn (Pedido $pedido): array => [
                'id' => $pedido->id,
                'fecha' => $pedido->fecha,
                'cliente' => $pedido->cliente?->razon_social,
                'vendedor' => $pedido->user?->name,
                'tipo_precio' => $pedido->tipo_precio,
                'tipo_pago' => $pedido->tipo_pago,
                'estado' => $pedido->estado,
                'estado_pago' => $pedido->estado_pago,
                'total_a_pagar' => $pedido->total_a_pagar,
                'saldo_pendiente' => $pedido->saldo_pendiente,
                'productos' => $pedido->detalles
                    ->map(fn ($detalle): string => (float) $detalle->cantidad.' x '.($detalle->producto?->concatenar_codigo_nombre ?? $detalle->producto?->referencia_producto ?? 'Producto '.$detalle->producto_id))
                    ->all(),
            ]);
    }

    /**
     * Everything sellable on a pedido, with the image, extra price and stock
     * fields the catalog cards need. Stock is informational only —
     * out-of-stock products are still sellable, so this is not filtered to
     * stock > 0 (unlike the Cotizador catalog).
     *
     * @return array<int, array<string, mixed>>
     */
    private function catalogoProductos(): array
    {
        return Producto::where('categoria', '!=', 'SERVICIO')
            ->where('inventariable', true)
            ->select(['id', 'referencia_producto', 'concatenar_codigo_nombre', 'categoria', 'sku', 'valor_detal', 'valor_mayorista', 'valor_sin_instalacion', 'costo_producto', 'imagen_producto'])
            ->with('stockBodegas:id,producto_id,bodega_id,stock')
            ->orderBy('referencia_producto')
            ->get()
            ->map(fn (Producto $producto): array => [
                'id' => $producto->id,
                'referencia_producto' => $producto->referencia_producto,
                'concatenar_codigo_nombre' => $producto->concatenar_codigo_nombre,
                'categoria' => $producto->categoria,
                'sku' => $producto->sku,
                'valor_detal' => $producto->valor_detal,
                'valor_mayorista' => $producto->valor_mayorista,
                'valor_sin_instalacion' => $producto->valor_sin_instalacion,
                'costo_producto' => $producto->costo_producto,
                'imagen_producto_url' => $producto->imagen_producto_url,
                'stock_total' => (float) $producto->stockBodegas->sum('stock'),
                'stock_por_bodega' => $producto->stockBodegas->mapWithKeys(fn ($stock): array => [$stock->bodega_id => (float) $stock->stock])->all(),
            ])
            ->all();
    }
}
