<?php

namespace App\Http\Controllers;

use App\Models\Abono;
use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\Compra;
use App\Models\Marca;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Puc;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class HistorialController extends Controller
{
    /** Names of the logged fields, as people read them. */
    private const CAMPOS = [
        'cliente_id' => 'Cliente',
        'fecha' => 'Fecha',
        'user_id' => 'Vendedor',
        'vendedor_id' => 'Vendedor',
        'bodega_id' => 'Bodega',
        'tipo_precio' => 'Tipo de precio',
        'tipo_pago' => 'Tipo de pago',
        'turno' => 'Turno',
        'placa' => 'Placa',
        'facturacion_electronica' => 'Facturación electrónica',
        'observacion' => 'Observación',
        'observacion_pago' => 'Observación de pago',
        'flete' => 'Flete',
        'descuento' => 'Descuento',
        'reteica' => 'Reteica',
        'retefuente' => 'Retefuente',
        'pedido_id' => 'Pedido',
        'monto' => 'Monto',
        'con_cuanto_pago' => 'Con cuánto pagó',
        'cambio' => 'Cambio',
        'puc_id' => 'Método de pago',
        'descripcion' => 'Descripción',
        'productos' => 'Productos',
        'total_a_pagar' => 'Total a pagar',
        'factura' => 'Factura',
        'proveedor_id' => 'Proveedor',
        'observaciones' => 'Observaciones',
        'categoria' => 'Categoría',
        'tipo' => 'Tipo',
        'inventariable' => 'Inventariable',
        'sku' => 'SKU',
        'referencia_producto' => 'Referencia',
        'descripcion_producto' => 'Descripción',
        'marca_id' => 'Marca',
        'ancho' => 'Ancho',
        'perfil' => 'Perfil',
        'construccion' => 'Construcción',
        'rin' => 'Rin',
        'tipo_vehiculo' => 'Tipo de vehículo',
        'diametro' => 'Diámetro',
        'costo_producto' => 'Costo',
        'valor_detal' => 'Valor detal',
        'valor_mayorista' => 'Valor mayorista',
        'valor_sin_instalacion' => 'Valor sin instalación',
    ];

    /** Fields that hold money, shown as $1.234. */
    private const DINERO = [
        'flete', 'descuento', 'reteica', 'retefuente', 'monto', 'con_cuanto_pago', 'cambio', 'total_a_pagar',
        'costo_producto', 'valor_detal', 'valor_mayorista', 'valor_sin_instalacion',
    ];

    /** Product prices: only for whoever may see that price (see "Precios permitidos"). */
    private const PRECIOS = [
        'costo_producto' => 'costo',
        'valor_detal' => 'valor_detal',
        'valor_mayorista' => 'valor_mayorista',
    ];

    /**
     * The latest changes made in the app (who did what, when and what changed).
     */
    public function index(): Response
    {
        Gate::authorize('historial.view');

        $actividades = Activity::query()
            ->with('causer:id,name')
            ->latest()
            ->latest('id')
            ->limit(2000)
            ->get();

        $nombres = $this->nombres($actividades);
        $productosPorId = Producto::withTrashed()
            ->whereIn('id', $actividades->where('subject_type', Producto::class)->pluck('subject_id'))
            ->get(['id', 'concatenar_codigo_nombre', 'referencia_producto'])
            ->mapWithKeys(fn (Producto $producto) => [$producto->id => $producto->concatenar_codigo_nombre ?? $producto->referencia_producto])
            ->all();

        return Inertia::render('historial/index', [
            'actividades' => $actividades->map(fn (Activity $actividad): array => [
                'id' => $actividad->id,
                'fecha' => $actividad->created_at->toIso8601String(),
                'usuario' => $actividad->causer?->name ?? 'Sistema',
                'modulo' => $this->modulo($actividad),
                'registro' => $this->registro($actividad, $productosPorId),
                'accion' => $actividad->description,
                'cambios' => $this->cambios($actividad, $nombres),
            ])->values(),
        ]);
    }

    private function modulo(Activity $actividad): string
    {
        return match ($actividad->subject_type) {
            Pedido::class => 'Pedidos',
            Abono::class => 'Pedidos',
            Compra::class => 'Compras',
            Producto::class => 'Productos',
            default => class_basename((string) $actividad->subject_type),
        };
    }

    /**
     * @param  array<int, string>  $productos  Product names by id.
     */
    private function registro(Activity $actividad, array $productos = []): string
    {
        $propiedades = $actividad->properties;
        $pedidoId = $actividad->subject_type === Abono::class
            ? ($propiedades['attributes']['pedido_id'] ?? $propiedades['old']['pedido_id'] ?? null)
            : $actividad->subject_id;

        return match ($actividad->subject_type) {
            Abono::class => 'Abono del pedido #'.($pedidoId ?? '?'),
            Compra::class => 'Compra #'.$actividad->subject_id,
            Producto::class => 'Producto #'.$actividad->subject_id.($productos[$actividad->subject_id] ?? false ? ' · '.$productos[$actividad->subject_id] : ''),
            default => 'Pedido #'.$actividad->subject_id,
        };
    }

    /**
     * The changes of an entry as {campo, antes, despues} rows.
     *
     * @param  array<string, array<int|string, string>>  $nombres
     * @return list<array{campo: string, antes: string|null, despues: string|null}>
     */
    private function cambios(Activity $actividad, array $nombres): array
    {
        $nuevos = $actividad->properties['attributes'] ?? [];
        $viejos = $actividad->properties['old'] ?? [];

        return collect(array_keys($nuevos + $viejos))
            ->reject(fn (string $campo): bool => isset(self::PRECIOS[$campo]) && ! auth()->user()->puedeVerPrecio(self::PRECIOS[$campo]))
            ->map(fn (string $campo): array => [
                'campo' => self::CAMPOS[$campo] ?? $campo,
                'antes' => array_key_exists($campo, $viejos) ? $this->formatear($campo, $viejos[$campo], $nombres) : null,
                'despues' => array_key_exists($campo, $nuevos) ? $this->formatear($campo, $nuevos[$campo], $nombres) : null,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, array<int|string, string>>  $nombres
     */
    private function formatear(string $campo, mixed $valor, array $nombres): ?string
    {
        if ($valor === null || $valor === '') {
            return null;
        }

        if ($campo === 'productos' && is_array($valor)) {
            return collect($valor)
                ->map(fn (array $linea): string => sprintf('%s × %s a $%s', $linea['producto'], $linea['cantidad'] + 0, number_format((float) $linea['precio_unitario'], 0, ',', '.'))
                    .(isset($linea['bodega']) ? " · {$linea['bodega']}" : '')
                    .(isset($linea['estado']) ? ' · '.ucfirst(strtolower($linea['estado'])) : ''))
                ->implode("\n");
        }

        if (in_array($campo, self::DINERO, true) && is_numeric($valor)) {
            return '$'.number_format((float) $valor, 0, ',', '.');
        }

        if (isset($nombres[$campo][$valor])) {
            return $nombres[$campo][$valor];
        }

        if (is_bool($valor)) {
            return $valor ? 'Sí' : 'No';
        }

        return (string) $valor;
    }

    /**
     * The names behind the ids that appear in the logged changes.
     *
     * @param  Collection<int, Activity>  $actividades
     * @return array<string, array<int|string, string>>
     */
    private function nombres(Collection $actividades): array
    {
        $ids = ['cliente_id' => [], 'marca_id' => [], 'proveedor_id' => [], 'user_id' => [], 'vendedor_id' => [], 'bodega_id' => [], 'puc_id' => []];

        foreach ($actividades as $actividad) {
            foreach (['attributes', 'old'] as $lado) {
                foreach (array_keys($ids) as $campo) {
                    $valor = $actividad->properties[$lado][$campo] ?? null;

                    if ($valor !== null) {
                        $ids[$campo][] = $valor;
                    }
                }
            }
        }

        $usuarios = User::whereIn('id', array_merge($ids['user_id'], $ids['vendedor_id']))->pluck('name', 'id')->all();

        return [
            'cliente_id' => Cliente::withTrashed()->whereIn('id', $ids['cliente_id'])->pluck('razon_social', 'id')->all(),
            'marca_id' => Marca::whereIn('id', $ids['marca_id'])->pluck('marca', 'id')->all(),
            'proveedor_id' => Proveedor::withTrashed()->whereIn('id', $ids['proveedor_id'])->pluck('nombre_proveedor', 'id')->all(),
            'user_id' => $usuarios,
            'vendedor_id' => $usuarios,
            'bodega_id' => Bodega::whereIn('id', $ids['bodega_id'])->pluck('nombre_bodega', 'id')->all(),
            'puc_id' => Puc::whereIn('id', $ids['puc_id'])->pluck('concatenar_subcuenta_concepto', 'id')->all(),
        ];
    }
}
