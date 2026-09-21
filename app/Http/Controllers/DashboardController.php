<?php

namespace App\Http\Controllers;

use App\Models\Bodega;
use App\Models\Gasto;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\TeamInvitation;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filtros = $this->filtros($request);
        $email = strtolower($request->user()->email);

        $pendingInvitations = TeamInvitation::query()
            ->with(['inviter', 'team'])
            ->whereRaw('LOWER(email) = ?', [$email])
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now()))
            ->latest()
            ->get()
            ->map(fn (TeamInvitation $invitation) => [
                'code' => $invitation->code,
                'inviterName' => $invitation->inviter->name,
                'team' => [
                    'name' => $invitation->team->name,
                    'slug' => $invitation->team->slug,
                ],
            ]);

        return Inertia::render('dashboard', [
            'pendingInvitations' => $pendingInvitations,
            'cantidadPorBodega' => $this->cantidadPorBodega($filtros),
            'resumen' => $this->resumen($filtros),
            'graficos' => $this->graficos($filtros),
            'filtros' => $filtros,
            'bodegas' => Bodega::orderBy('nombre_bodega')->get(['id', 'nombre_bodega']),
            // Only products that were ever sold or bought, to keep the list small.
            'productosFiltro' => Producto::query()
                ->where(fn ($query) => $query
                    ->whereIn('id', DB::table('detalle_pedidos')->select('producto_id'))
                    ->orWhereIn('id', DB::table('detalle_compras')->select('producto_id')))
                ->orderBy('concatenar_codigo_nombre')
                ->get(['id', 'concatenar_codigo_nombre', 'tipo_vehiculo']),
        ]);
    }

    /**
     * @return array{bodega_ids: list<string>, desde: string, hasta: string, tipo_vehiculo: string, producto_ids: list<string>}
     */
    private function filtros(Request $request): array
    {
        $datos = $request->validate([
            'bodega_ids' => ['nullable', 'array'],
            'bodega_ids.*' => ['regex:/^(\d+|mayorista)$/'],
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date'],
            'tipo_vehiculo' => ['nullable', 'in:MOTO,CARRO'],
            'producto_ids' => ['nullable', 'array'],
            'producto_ids.*' => ['integer'],
        ]);

        return [
            'bodega_ids' => array_map('strval', $datos['bodega_ids'] ?? []),
            'desde' => (string) ($datos['desde'] ?? ''),
            'hasta' => (string) ($datos['hasta'] ?? ''),
            'tipo_vehiculo' => (string) ($datos['tipo_vehiculo'] ?? ''),
            'producto_ids' => array_map('strval', $datos['producto_ids'] ?? []),
        ];
    }

    /**
     * Keeps the rows of the selected bodegas. "mayorista" acts as one more
     * bodega: those orders are kept only when it is selected, and leave the
     * regular bodegas out of the count.
     *
     * @template TQuery of \Illuminate\Contracts\Database\Query\Builder
     *
     * @param  TQuery  $query
     * @param  array<string, mixed>  $filtros
     * @return TQuery
     */
    private function limitarPorBodegas($query, array $filtros, string $columnaBodega)
    {
        $ids = array_values(array_filter($filtros['bodega_ids'], fn (string $id) => $id !== 'mayorista'));
        $incluyeMayorista = in_array('mayorista', $filtros['bodega_ids'], true);

        return $query->where(function ($grupo) use ($ids, $incluyeMayorista, $columnaBodega) {
            $grupo->where(fn ($regular) => $regular
                ->where('pedidos.tipo_precio', '<>', 'MAYORISTA')
                ->whereIn(DB::raw($columnaBodega), array_map('intval', $ids)));

            if ($incluyeMayorista) {
                $grupo->orWhere('pedidos.tipo_precio', 'MAYORISTA');
            }
        });
    }

    /**
     * Sold lines (of non-deleted orders) narrowed by the dashboard filters.
     *
     * @param  array<string, mixed>  $filtros
     */
    private function detalles(array $filtros): Builder
    {
        return DB::table('detalle_pedidos')
            ->join('pedidos', 'pedidos.id', '=', 'detalle_pedidos.pedido_id')
            ->join('productos', 'productos.id', '=', 'detalle_pedidos.producto_id')
            ->whereNull('pedidos.deleted_at')
            ->when($filtros['bodega_ids'] !== [], fn (Builder $query) => $this->limitarPorBodegas($query, $filtros, 'COALESCE(detalle_pedidos.bodega_id, pedidos.bodega_id)'))
            ->when($filtros['desde'] !== '', fn (Builder $query) => $query->where('pedidos.fecha', '>=', $filtros['desde']))
            ->when($filtros['hasta'] !== '', fn (Builder $query) => $query->where('pedidos.fecha', '<=', $filtros['hasta']))
            ->when($filtros['tipo_vehiculo'] !== '', fn (Builder $query) => $query->where('productos.tipo_vehiculo', $filtros['tipo_vehiculo']))
            ->when($filtros['producto_ids'] !== [], fn (Builder $query) => $query->whereIn('detalle_pedidos.producto_id', $filtros['producto_ids']));
    }

    /**
     * Expenses narrowed by the dashboard filters. They do not depend on
     * products, only on bodega and dates.
     *
     * @param  array<string, mixed>  $filtros
     * @return EloquentBuilder<Gasto>
     */
    private function gastos(array $filtros): EloquentBuilder
    {
        return Gasto::query()
            ->when($filtros['bodega_ids'] !== [], fn ($query) => $query->whereIn('bodega_id', array_filter($filtros['bodega_ids'], fn (string $id) => $id !== 'mayorista')))
            ->when($filtros['desde'] !== '', fn ($query) => $query->where('fecha_gasto', '>=', $filtros['desde']))
            ->when($filtros['hasta'] !== '', fn ($query) => $query->where('fecha_gasto', '<=', $filtros['hasta']));
    }

    /**
     * Units sold per bodega split by product tipo. Mayorista orders are
     * pulled out of their bodega and grouped in their own "Mayorista" row.
     *
     * @return array{filas: list<array{almacen: string, NUEVO: int, USADO: int, SERVICIO: int, total: int, valores: array<string, float>}>, totales: array{NUEVO: int, USADO: int, SERVICIO: int, total: int}}
     */
    private function cantidadPorBodega(array $filtros): array
    {
        $tipos = ['NUEVO', 'USADO', 'SERVICIO'];
        $vacia = fn (string $almacen): array => ['almacen' => $almacen, 'NUEVO' => 0, 'USADO' => 0, 'SERVICIO' => 0, 'total' => 0, 'valores' => ['NUEVO' => 0.0, 'USADO' => 0.0, 'SERVICIO' => 0.0, 'total' => 0.0]];

        $filas = [];
        $bodegas = Bodega::orderBy('nombre_bodega')
            ->when($filtros['bodega_ids'] !== [], fn ($query) => $query->whereKey(array_filter($filtros['bodega_ids'], fn (string $id) => $id !== 'mayorista')))
            ->get(['id', 'nombre_bodega']);

        foreach ($bodegas as $bodega) {
            $filas['b'.$bodega->id] = $vacia($bodega->nombre_bodega);
        }
        if ($filtros['bodega_ids'] === [] || in_array('mayorista', $filtros['bodega_ids'], true)) {
            $filas['mayorista'] = $vacia('Mayorista');
        }

        $ventas = $this->detalles($filtros)
            ->selectRaw("CASE WHEN pedidos.tipo_precio = 'MAYORISTA' THEN 'mayorista' ELSE COALESCE(detalle_pedidos.bodega_id, pedidos.bodega_id) END as grupo")
            ->selectRaw('productos.tipo as tipo, SUM(detalle_pedidos.cantidad) as cantidad, SUM(detalle_pedidos.subtotal) as valor')
            ->groupBy('grupo', 'productos.tipo')
            ->get();

        foreach ($ventas as $venta) {
            $clave = $venta->grupo === 'mayorista' ? 'mayorista' : 'b'.$venta->grupo;
            $tipo = in_array($venta->tipo, $tipos, true) ? $venta->tipo : 'NUEVO';

            if (! isset($filas[$clave])) {
                continue;
            }

            $filas[$clave][$tipo] += (int) $venta->cantidad;
            $filas[$clave]['total'] += (int) $venta->cantidad;
            $filas[$clave]['valores'][$tipo] += (float) $venta->valor;
            $filas[$clave]['valores']['total'] += (float) $venta->valor;
        }

        $totales = ['NUEVO' => 0, 'USADO' => 0, 'SERVICIO' => 0, 'total' => 0];
        foreach ($filas as $fila) {
            foreach (array_keys($totales) as $columna) {
                $totales[$columna] += $fila[$columna];
            }
        }

        return ['filas' => array_values($filas), 'totales' => $totales];
    }

    /**
     * The orders the "valor de pedidos" widget adds up. With a product or
     * vehicle filter an order's total can't be split by line, so the orders
     * that contain those lines are the ones counted.
     *
     * @param  array<string, mixed>  $filtros
     * @return EloquentBuilder<Pedido>
     */
    private function pedidos(array $filtros, Builder $detalles, bool $filtraPorProducto): EloquentBuilder
    {
        return Pedido::query()
            ->when($filtraPorProducto,
                fn ($query) => $query->whereIn('id', (clone $detalles)->select('pedidos.id')),
                fn ($query) => $query
                    ->when($filtros['bodega_ids'] !== [], fn ($query) => $this->limitarPorBodegas($query, $filtros, 'pedidos.bodega_id'))
                    ->when($filtros['desde'] !== '', fn ($query) => $query->where('fecha', '>=', $filtros['desde']))
                    ->when($filtros['hasta'] !== '', fn ($query) => $query->where('fecha', '<=', $filtros['hasta'])));
    }

    /**
     * Data behind the dashboard charts: units by product category, the ten
     * best sellers and the orders per day (count, sales value and cost) plus the
     * expenses per day (the client regroups the days into weeks, months or
     * years and derives the profit line).
     *
     * @param  array<string, mixed>  $filtros
     * @return array{categorias: list<array{categoria: string, cantidad: int, valor: float}>, topProductos: list<array{producto: string, cantidad: int, valor: float}>, pedidosPorFecha: list<array{fecha: string, pedidos: int, cantidad: int, valor: float, inversion: float}>, gastosPorFecha: list<array{fecha: string, gastos: float}>}
     */
    private function graficos(array $filtros): array
    {
        $detalles = $this->detalles($filtros);

        $categorias = (clone $detalles)
            ->selectRaw("COALESCE(productos.categoria, 'SIN CATEGORÍA') as categoria, SUM(detalle_pedidos.cantidad) as cantidad, SUM(detalle_pedidos.subtotal) as valor")
            ->groupBy('productos.categoria')
            ->orderByDesc('cantidad')
            ->get()
            ->map(fn ($fila) => ['categoria' => $fila->categoria, 'cantidad' => (int) $fila->cantidad, 'valor' => (float) $fila->valor])
            ->all();

        $topProductos = (clone $detalles)
            ->selectRaw('detalle_pedidos.producto_id, MAX(productos.concatenar_codigo_nombre) as producto, SUM(detalle_pedidos.cantidad) as cantidad, SUM(detalle_pedidos.subtotal) as valor')
            ->groupBy('detalle_pedidos.producto_id')
            ->orderByDesc('cantidad')
            ->limit(10)
            ->get()
            ->map(fn ($fila) => ['producto' => $fila->producto ?? 'Producto '.$fila->producto_id, 'cantidad' => (int) $fila->cantidad, 'valor' => (float) $fila->valor])
            ->all();

        $filtraPorProducto = $filtros['tipo_vehiculo'] !== '' || $filtros['producto_ids'] !== [];

        $lineasPorFecha = (clone $detalles)
            ->selectRaw('substr(pedidos.fecha, 1, 10) as dia, COUNT(DISTINCT pedidos.id) as pedidos, SUM(detalle_pedidos.cantidad) as cantidad, SUM(detalle_pedidos.subtotal) as valor, SUM(detalle_pedidos.costo_total) as inversion')
            ->groupBy('dia')
            ->get()
            ->keyBy('dia');

        // The sales value per day is valued exactly like the "valor de
        // pedidos" widget (order totals, or the lines when filtering by
        // product), so the chart adds up to the same figures.
        $valorPorFecha = $filtraPorProducto
            ? $lineasPorFecha->map(fn ($fila) => (float) $fila->valor)
            : $this->pedidos($filtros, $detalles, false)
                ->selectRaw('substr(fecha, 1, 10) as dia, COALESCE(SUM(total_a_pagar), 0) as valor')
                ->groupBy('dia')
                ->get()
                ->mapWithKeys(fn ($fila) => [$fila->dia => (float) $fila->valor]);

        $pedidosPorFecha = $lineasPorFecha->keys()
            ->merge($valorPorFecha->keys())
            ->unique()
            ->sort()
            ->values()
            ->map(fn (string $dia) => [
                'fecha' => $dia,
                'pedidos' => (int) ($lineasPorFecha[$dia]->pedidos ?? 0),
                'cantidad' => (int) ($lineasPorFecha[$dia]->cantidad ?? 0),
                'valor' => (float) ($valorPorFecha[$dia] ?? 0),
                'inversion' => (float) ($lineasPorFecha[$dia]->inversion ?? 0),
            ])
            ->all();

        $gastosPorFecha = $this->gastos($filtros)
            ->selectRaw('fecha_gasto as fecha, SUM(monto) as gastos')
            ->groupBy('fecha_gasto')
            ->orderBy('fecha_gasto')
            ->get()
            ->map(fn ($fila) => [
                'fecha' => substr((string) $fila->getRawOriginal('fecha'), 0, 10),
                'gastos' => (float) $fila->gastos,
            ])
            ->all();

        return compact('categorias', 'topProductos', 'pedidosPorFecha', 'gastosPorFecha');
    }

    /**
     * Headline figures for the dashboard widgets.
     *
     * @param  array<string, mixed>  $filtros
     * @return array<string, mixed>
     */
    private function resumen(array $filtros): array
    {
        $detalles = $this->detalles($filtros);
        $filtraPorProducto = $filtros['tipo_vehiculo'] !== '' || $filtros['producto_ids'] !== [];

        $productos = (clone $detalles)
            ->selectRaw('COALESCE(SUM(detalle_pedidos.cantidad), 0) as cantidad, COALESCE(SUM(detalle_pedidos.subtotal), 0) as valor, COALESCE(SUM(detalle_pedidos.costo_total), 0) as inversion')
            ->first();

        $serie = (clone $detalles)
            ->when($filtros['desde'] === '' && $filtros['hasta'] === '', fn (Builder $query) => $query
                ->where('pedidos.fecha', '>=', now()->subDays(29)->toDateString()))
            ->selectRaw('pedidos.fecha as fecha, SUM(detalle_pedidos.cantidad) as cantidad, SUM(detalle_pedidos.subtotal) as valor')
            ->groupBy('pedidos.fecha')
            ->orderBy('pedidos.fecha')
            ->get()
            ->map(fn ($fila) => [
                'fecha' => substr((string) $fila->fecha, 0, 10),
                'cantidad' => (int) $fila->cantidad,
                'valor' => (float) $fila->valor,
            ])
            ->all();

        // With a product/vehicle filter an order's total can't be split by
        // line, so the orders that contain those lines are valued by their lines.
        $pedidos = $this->pedidos($filtros, $detalles, $filtraPorProducto)
            ->selectRaw('COUNT(*) as cantidad, COALESCE(SUM(total_a_pagar), 0) as valor, COALESCE(SUM(descuento), 0) as descuento, COALESCE(SUM(reteica), 0) as reteica, COALESCE(SUM(retefuente), 0) as retefuente')
            ->first();

        // Expenses do not depend on products, only on bodega and dates.
        $gastos = (float) $this->gastos($filtros)->sum('monto');
        $inversion = (float) $productos->inversion;
        $valorPedidos = $filtraPorProducto ? (float) $productos->valor : (float) $pedidos->valor;

        return [
            'productosVendidos' => [
                'cantidad' => (int) $productos->cantidad,
                'valor' => (float) $productos->valor,
                'serie' => $serie,
            ],
            'valorPedidos' => ['valor' => $valorPedidos, 'cantidad' => (int) $pedidos->cantidad],
            'inversion' => $inversion,
            'gastos' => $gastos,
            'ganancia' => $valorPedidos - ($inversion + $gastos),
            'ajustes' => [
                'reteica' => (float) $pedidos->reteica,
                'retefuente' => (float) $pedidos->retefuente,
                'descuento' => (float) $pedidos->descuento,
            ],
        ];
    }
}
