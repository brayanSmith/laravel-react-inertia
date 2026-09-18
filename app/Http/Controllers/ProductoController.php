<?php

namespace App\Http\Controllers;

use App\Http\Requests\Productos\StoreProductoRequest;
use App\Http\Requests\Productos\UpdateProductoRequest;
use App\Models\Bodega;
use App\Models\DetalleCompra;
use App\Models\DetallePedido;
use App\Models\Marca;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductoController extends Controller
{
    /**
     * Display a listing of productos.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('productos.view');

        $productos = Producto::with([
            'marca',
            'stockBodegas',
            'detalleCompras' => fn ($query) => $query->where('estado_entrega', 'PENDIENTE')->with('compra.proveedor'),
        ])
            ->orderBy('referencia_producto')
            ->get()
            ->map(fn (Producto $producto) => $this->withListingData($producto));

        return Inertia::render('productos/index', [
            'productos' => $productos,
            'bodegas' => Bodega::orderBy('nombre_bodega')->get(['id', 'nombre_bodega']),
            'marcas' => Marca::orderBy('marca')->get(['id', 'marca']),
            'permissions' => $this->permissions($request),
        ]);
    }

    /**
     * Show the form for creating a new producto.
     */
    public function create(Request $request): Response
    {
        Gate::authorize('productos.create');

        return Inertia::render('productos/create', [
            'marcas' => Marca::orderBy('marca')->get(['id', 'marca']),
            'permissions' => $this->permissions($request),
        ]);
    }

    /**
     * Store a newly created producto.
     */
    public function store(StoreProductoRequest $request): RedirectResponse
    {
        Gate::authorize('productos.create');

        $data = $request->validated();

        if ($request->hasFile('imagen_producto')) {
            $data['imagen_producto'] = $request->file('imagen_producto')->store('productos', 'public');
        }

        $data['concatenar_codigo_nombre'] = $this->buildConcatenacion($data);

        Producto::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Producto created.')]);

        return to_route('productos.index', ['current_team' => $request->route('current_team')]);
    }

    /**
     * Display the specified producto.
     */
    public function show(Request $request, string $current_team, Producto $producto): Response
    {
        Gate::authorize('productos.view');

        return Inertia::render('productos/show', [
            'producto' => $producto->load('marca'),
            'permissions' => $this->permissions($request),
        ]);
    }

    /**
     * List the pedido and compra detail history for the specified producto,
     * paginated independently so a product with a long history doesn't
     * require loading every record at once.
     */
    public function detalles(Request $request, string $current_team, Producto $producto): JsonResponse
    {
        Gate::authorize('productos.view');

        $detallePedidosQuery = DetallePedido::query()->where('producto_id', $producto->id);
        $detalleComprasQuery = DetalleCompra::query()->where('producto_id', $producto->id);

        $totalVendido = (clone $detallePedidosQuery)->sum('cantidad');
        $totalComprado = (clone $detalleComprasQuery)->sum('cantidad');

        $detallePedidos = $detallePedidosQuery
            ->with([
                'pedido:id,fecha,estado,cliente_id',
                'pedido.cliente:id,razon_social',
            ])
            ->orderByDesc('id')
            ->paginate(10, ['*'], 'pedidos_page');

        $detalleCompras = $detalleComprasQuery
            ->with([
                'compra:id,factura,fecha,estado,proveedor_id',
                'compra.proveedor:id,nombre_proveedor',
                'bodega:id,nombre_bodega',
            ])
            ->orderByDesc('id')
            ->paginate(10, ['*'], 'compras_page');

        return response()->json([
            'detallePedidos' => $detallePedidos,
            'detalleCompras' => $detalleCompras,
            'totalComprado' => (float) $totalComprado,
            'totalVendido' => (float) $totalVendido,
        ]);
    }

    /**
     * Show the form for editing the specified producto.
     */
    public function edit(Request $request, string $current_team, Producto $producto): Response
    {
        Gate::authorize('productos.update');

        return Inertia::render('productos/edit', [
            'producto' => $producto->load('marca'),
            'marcas' => Marca::orderBy('marca')->get(['id', 'marca']),
            'permissions' => $this->permissions($request),
        ]);
    }

    /**
     * Update the specified producto.
     */
    public function update(UpdateProductoRequest $request, string $current_team, Producto $producto): RedirectResponse
    {
        Gate::authorize('productos.update');

        $data = $request->safe()->except(['imagen_producto', 'remove_imagen_producto']);

        if ($request->hasFile('imagen_producto')) {
            if ($producto->imagen_producto) {
                Storage::disk('public')->delete($producto->imagen_producto);
            }

            $data['imagen_producto'] = $request->file('imagen_producto')->store('productos', 'public');
        } elseif ($request->boolean('remove_imagen_producto') && $producto->imagen_producto) {
            Storage::disk('public')->delete($producto->imagen_producto);
            $data['imagen_producto'] = null;
        }

        $data['concatenar_codigo_nombre'] = $this->buildConcatenacion($data);

        $producto->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Producto updated.')]);

        return to_route('productos.index', ['current_team' => $current_team]);
    }

    /**
     * Remove the specified producto.
     */
    public function destroy(string $current_team, Producto $producto): RedirectResponse
    {
        Gate::authorize('productos.delete');

        $producto->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Producto deleted.')]);

        return to_route('productos.index', ['current_team' => $current_team]);
    }

    /**
     * Build the display concatenation of reference, brand and description.
     *
     * @param  array<string, mixed>  $data
     */
    private function buildConcatenacion(array $data): string
    {
        $marca = Marca::whereKey($data['marca_id'] ?? null)->first();

        return implode('-', array_filter([
            $data['referencia_producto'] ?? null,
            $marca?->marca,
            $data['descripcion_producto'] ?? null,
        ]));
    }

    /**
     * Build the listing array for a producto, adding stock and pending-purchase summaries.
     *
     * @return array<string, mixed>
     */
    private function withListingData(Producto $producto): array
    {
        $pendientes = $producto->detalleCompras;

        $proveedoresPendientes = $pendientes
            ->pluck('compra.proveedor.nombre_proveedor')
            ->filter()
            ->unique()
            ->values();

        $data = $producto->toArray();
        $data['stock_total'] = (float) $producto->stockBodegas->sum('stock');
        $data['pendiente'] = $pendientes->pluck('compra_id')->unique()->count();
        $data['proveedor_pendiente'] = $proveedoresPendientes->isEmpty()
            ? null
            : $proveedoresPendientes->implode(', ');
        $data['stock_por_bodega'] = $producto->stockBodegas->pluck('stock', 'bodega_id');

        unset($data['stock_bodegas'], $data['detalle_compras']);

        return $data;
    }

    /**
     * @return array{canCreate: bool, canUpdate: bool, canDelete: bool}
     */
    private function permissions(Request $request): array
    {
        return [
            'canCreate' => $request->user()->can('productos.create'),
            'canUpdate' => $request->user()->can('productos.update'),
            'canDelete' => $request->user()->can('productos.delete'),
        ];
    }
}
