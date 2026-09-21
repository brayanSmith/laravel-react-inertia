<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesTrash;
use App\Http\Requests\Productos\StoreProductoRequest;
use App\Http\Requests\Productos\UpdateProductoRequest;
use App\Models\Bodega;
use App\Models\DetalleCompra;
use App\Models\DetallePedido;
use App\Models\Marca;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\StockBodega;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductoController extends Controller
{
    use HandlesTrash;

    /**
     * Display a listing of productos.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('productos.view');

        $eliminados = $this->verEliminados($request, 'productos');

        return Inertia::render('productos/index', [
            'productos' => $this->listado($eliminados),
            'eliminados' => $eliminados,
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

        // Created from another screen (the POS): stay there.
        if ($request->boolean('stay_on_page')) {
            return back();
        }

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
     * The productos listing with its stock per bodega and pending purchases.
     *
     * Built from plain rows plus three small queries instead of hydrating
     * every model with its relations (which took seconds and megabytes): the
     * listing has thousands of products and only needs a handful of numbers
     * from each.
     *
     * @return list<array<string, mixed>>
     */
    private function listado(bool $eliminados): array
    {
        $productos = Producto::query()
            ->when($eliminados, fn ($query) => $query->onlyTrashed())
            ->orderBy('referencia_producto')
            ->toBase()
            ->get([
                'id', 'categoria', 'tipo', 'inventariable', 'sku', 'ancho', 'perfil', 'construccion', 'rin',
                'tipo_vehiculo', 'diametro', 'marca_id', 'referencia_producto', 'descripcion_producto',
                'costo_producto', 'valor_detal', 'valor_mayorista', 'valor_sin_instalacion',
                'imagen_producto', 'concatenar_codigo_nombre',
            ]);

        $marcas = Marca::pluck('marca', 'id');

        $stock = StockBodega::query()
            ->whereIn('producto_id', $productos->pluck('id'))
            ->get(['producto_id', 'bodega_id', 'stock'])
            ->groupBy('producto_id');

        // Pending (not yet received) purchase lines, with their proveedor.
        $proveedores = (new Proveedor)->getTable();

        $pendientes = DB::table('detalle_compras')
            ->join('compras', 'compras.id', '=', 'detalle_compras.compra_id')
            ->leftJoin($proveedores, "{$proveedores}.id", '=', 'compras.proveedor_id')
            ->where('detalle_compras.estado_entrega', 'PENDIENTE')
            ->whereNull('detalle_compras.deleted_at')
            ->whereNull('compras.deleted_at')
            ->get(['detalle_compras.producto_id', 'detalle_compras.compra_id', "{$proveedores}.nombre_proveedor"])
            ->groupBy('producto_id');

        $dinero = fn (mixed $valor): ?string => $valor === null ? null : number_format((float) $valor, 2, '.', '');

        return $productos->map(function (object $producto) use ($marcas, $stock, $pendientes, $dinero): array {
            $filasStock = $stock->get($producto->id, collect());
            $filasPendientes = $pendientes->get($producto->id, collect());
            $proveedores = $filasPendientes->pluck('nombre_proveedor')->filter()->unique()->values();

            return [
                'id' => $producto->id,
                'categoria' => $producto->categoria,
                'tipo' => $producto->tipo,
                'inventariable' => (bool) $producto->inventariable,
                'sku' => $producto->sku,
                'ancho' => $producto->ancho,
                'perfil' => $producto->perfil,
                'construccion' => $producto->construccion,
                'rin' => $producto->rin,
                'tipo_vehiculo' => $producto->tipo_vehiculo,
                'diametro' => $producto->diametro,
                'marca_id' => $producto->marca_id,
                'marca' => isset($marcas[$producto->marca_id])
                    ? ['id' => $producto->marca_id, 'marca' => $marcas[$producto->marca_id]]
                    : null,
                'referencia_producto' => $producto->referencia_producto,
                'descripcion_producto' => $producto->descripcion_producto,
                'costo_producto' => $dinero($producto->costo_producto),
                'valor_detal' => $dinero($producto->valor_detal),
                'valor_mayorista' => $dinero($producto->valor_mayorista),
                'valor_sin_instalacion' => $dinero($producto->valor_sin_instalacion),
                'imagen_producto_url' => $producto->imagen_producto ? Storage::disk('public')->url($producto->imagen_producto) : null,
                'concatenar_codigo_nombre' => $producto->concatenar_codigo_nombre,
                'stock_total' => (float) $filasStock->sum('stock'),
                'pendiente' => $filasPendientes->pluck('compra_id')->unique()->count(),
                'proveedor_pendiente' => $proveedores->isEmpty() ? null : $proveedores->implode(', '),
                'stock_por_bodega' => $filasStock->pluck('stock', 'bodega_id'),
            ];
        })->all();
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

    /**
     * Restore a deleted producto.
     */
    public function restore(string $current_team, Producto $producto): RedirectResponse
    {
        return $this->restaurarRegistro('productos', $producto, __('Producto restored.'));
    }
}
