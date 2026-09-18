<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CotizadorController extends Controller
{
    /**
     * Display the quote generator: search a product by reference and get a
     * ready-to-send price quote (WhatsApp-style text) for every match.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('cotizador.view');

        return Inertia::render('cotizador/index', [
            'productos' => $this->productosConStock(),
            'tipoPrecioRestringido' => $this->tipoPrecioRestringido($request),
        ]);
    }

    /**
     * Products currently in stock, with the fields the quote builder needs.
     * Cached briefly since this list rarely changes minute to minute and is
     * otherwise recomputed (with a stock sum) on every page load.
     *
     * @return array<int, array<string, mixed>>
     */
    private function productosConStock(): array
    {
        return Cache::remember('cotizador.productos', now()->addMinutes(5), function (): array {
            return Producto::query()
                ->select(['id', 'referencia_producto', 'concatenar_codigo_nombre', 'valor_detal', 'valor_mayorista', 'imagen_producto'])
                ->withSum('stockBodegas as stock_total', 'stock')
                ->whereRaw('(select coalesce(sum(stock), 0) from stock_bodegas where stock_bodegas.producto_id = productos.id) > 0')
                ->get()
                ->map(fn (Producto $producto): array => [
                    'id' => $producto->id,
                    'referencia_producto' => $producto->referencia_producto,
                    'concatenar_codigo_nombre' => $producto->concatenar_codigo_nombre,
                    'valor_detal' => $producto->valor_detal,
                    'valor_mayorista' => $producto->valor_mayorista,
                    'imagen_producto_url' => $producto->imagen_producto_url,
                    'stock_total' => (float) $producto->stock_total,
                ])
                ->all();
        });
    }

    /**
     * If the user can only view one of the DETAL/MAYORISTA pedido modules,
     * lock the quote builder's price type to that one. Users with access to
     * both (or neither) get the free choice.
     */
    private function tipoPrecioRestringido(Request $request): ?string
    {
        $user = $request->user();
        $canDetal = $user->can('pedidos.view');
        $canMayorista = $user->can('pedidos-mayoristas.view');

        return match (true) {
            $canDetal && ! $canMayorista => 'DETAL',
            $canMayorista && ! $canDetal => 'MAYORISTA',
            default => null,
        };
    }
}
