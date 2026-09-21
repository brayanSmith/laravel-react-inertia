<?php

namespace App\Http\Controllers;

use App\Models\Abono;
use App\Models\Bodega;
use App\Models\Cliente;
use App\Models\Compra;
use App\Models\Gasto;
use App\Models\Marca;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Puc;
use App\Models\StockInicial;
use App\Models\Traslado;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class HistorialController extends Controller
{
    /**
     * The records that leave a history: the module they belong to, how the
     * record is called and the column that names it (null when it has none).
     *
     * @var array<class-string, array{modulo: string, etiqueta: string, nombre: string|null}>
     */
    private const REGISTROS = [
        Pedido::class => ['modulo' => 'Pedidos', 'etiqueta' => 'Pedido', 'nombre' => null],
        Abono::class => ['modulo' => 'Pedidos', 'etiqueta' => 'Abono', 'nombre' => null],
        Compra::class => ['modulo' => 'Compras', 'etiqueta' => 'Compra', 'nombre' => null],
        Producto::class => ['modulo' => 'Productos', 'etiqueta' => 'Producto', 'nombre' => 'concatenar_codigo_nombre'],
        Cliente::class => ['modulo' => 'Clientes', 'etiqueta' => 'Cliente', 'nombre' => 'razon_social'],
        Gasto::class => ['modulo' => 'Gastos', 'etiqueta' => 'Gasto', 'nombre' => 'descripcion'],
        Proveedor::class => ['modulo' => 'Proveedores', 'etiqueta' => 'Proveedor', 'nombre' => 'nombre_proveedor'],
        StockInicial::class => ['modulo' => 'Stock inicial', 'etiqueta' => 'Stock inicial', 'nombre' => null],
        Traslado::class => ['modulo' => 'Traslados', 'etiqueta' => 'Traslado', 'nombre' => null],
        Marca::class => ['modulo' => 'Marcas', 'etiqueta' => 'Marca', 'nombre' => 'marca'],
        Bodega::class => ['modulo' => 'Bodegas', 'etiqueta' => 'Bodega', 'nombre' => 'nombre_bodega'],
    ];

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
        'tipo_documento' => 'Tipo de documento',
        'numero_documento' => 'Número de documento',
        'razon_social' => 'Razón social',
        'direccion' => 'Dirección',
        'telefono' => 'Teléfono',
        'ciudad' => 'Ciudad',
        'email' => 'Email',
        'activo' => 'Activo',
        'novedad' => 'Novedad',
        'retenedor_fuente' => 'Retenedor de fuente',
        'fecha_gasto' => 'Fecha del gasto',
        'nombre_proveedor' => 'Nombre',
        'razon_social_proveedor' => 'Razón social',
        'nit_proveedor' => 'NIT',
        'tipo_proveedor' => 'Tipo de proveedor',
        'categoria_proveedor' => 'Categoría',
        'departamento_proveedor' => 'Departamento',
        'ciudad_proveedor' => 'Ciudad',
        'direccion_proveedor' => 'Dirección',
        'telefono_proveedor' => 'Teléfono',
        'banco_proveedor' => 'Banco',
        'tipo_cuenta_proveedor' => 'Tipo de cuenta',
        'numero_cuenta_proveedor' => 'Número de cuenta',
        'convenio' => 'Convenio',
        'tiempo_respuesta' => 'Tiempo de respuesta',
        'fabricante' => 'Fabricante',
        'valor_flete' => 'Valor del flete',
        'producto_id' => 'Producto',
        'cantidad' => 'Cantidad',
        'bodega_donante_id' => 'Bodega de origen',
        'bodega_destino_id' => 'Bodega de destino',
        'marca' => 'Marca',
        'descripcion_marca' => 'Descripción',
        'nombre_bodega' => 'Nombre',
        'ubicacion_bodega' => 'Ubicación',
    ];

    /** Fields that hold money, shown as $1.234. */
    private const DINERO = [
        'flete', 'descuento', 'reteica', 'retefuente', 'monto', 'con_cuanto_pago', 'cambio', 'total_a_pagar',
        'costo_producto', 'valor_detal', 'valor_mayorista', 'valor_sin_instalacion', 'valor_flete',
    ];

    /** Product prices: only for whoever may see that price (see "Precios permitidos"). */
    private const PRECIOS = [
        'costo_producto' => 'costo',
        'valor_detal' => 'valor_detal',
        'valor_mayorista' => 'valor_mayorista',
    ];

    /** Fields that hold the id of another record, which is shown by name. */
    private const REFERENCIAS = [
        'cliente_id', 'marca_id', 'proveedor_id', 'user_id', 'vendedor_id', 'puc_id', 'producto_id',
        'bodega_id', 'bodega_donante_id', 'bodega_destino_id',
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
        $registros = $this->registros($actividades);

        return Inertia::render('historial/index', [
            'actividades' => $actividades->map(fn (Activity $actividad): array => [
                'id' => $actividad->id,
                'fecha' => $actividad->created_at->toIso8601String(),
                'usuario' => $actividad->causer?->name ?? 'Sistema',
                'modulo' => self::REGISTROS[$actividad->subject_type]['modulo'] ?? class_basename((string) $actividad->subject_type),
                'registro' => $this->registro($actividad, $registros),
                'accion' => $actividad->description,
                'cambios' => $this->cambios($actividad, $nombres),
            ])->values(),
        ]);
    }

    /**
     * "Producto #12 · LLANTA 175/70": what the entry is about.
     *
     * @param  array<string, array<int, string>>  $registros  Names of the records by model class and id.
     */
    private function registro(Activity $actividad, array $registros): string
    {
        $tipo = (string) $actividad->subject_type;
        $etiqueta = self::REGISTROS[$tipo]['etiqueta'] ?? class_basename($tipo);

        if ($tipo === Abono::class) {
            $pedidoId = $actividad->properties['attributes']['pedido_id'] ?? $actividad->properties['old']['pedido_id'] ?? '?';

            return "Abono del pedido #{$pedidoId}";
        }

        $nombre = $registros[$tipo][$actividad->subject_id] ?? null;

        return "{$etiqueta} #{$actividad->subject_id}".($nombre ? " · {$nombre}" : '');
    }

    /**
     * The names of the records the entries are about.
     *
     * @param  Collection<int, Activity>  $actividades
     * @return array<string, array<int, string>>
     */
    private function registros(Collection $actividades): array
    {
        $registros = [];

        foreach (self::REGISTROS as $modelo => $datos) {
            if ($datos['nombre'] === null) {
                continue;
            }

            $ids = $actividades->where('subject_type', $modelo)->pluck('subject_id');

            if ($ids->isEmpty()) {
                continue;
            }

            $consulta = method_exists($modelo, 'withTrashed') ? $modelo::withTrashed() : $modelo::query();

            $registros[$modelo] = $consulta->whereIn('id', $ids)->pluck($datos['nombre'], 'id')->all();
        }

        return $registros;
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
        $ids = array_fill_keys(self::REFERENCIAS, []);

        foreach ($actividades as $actividad) {
            foreach (['attributes', 'old'] as $lado) {
                foreach (self::REFERENCIAS as $campo) {
                    $valor = $actividad->properties[$lado][$campo] ?? null;

                    if ($valor !== null) {
                        $ids[$campo][] = $valor;
                    }
                }
            }
        }

        $usuarios = User::whereIn('id', array_merge($ids['user_id'], $ids['vendedor_id']))->pluck('name', 'id')->all();
        $bodegas = Bodega::whereIn('id', array_merge($ids['bodega_id'], $ids['bodega_donante_id'], $ids['bodega_destino_id']))->pluck('nombre_bodega', 'id')->all();

        return [
            'cliente_id' => Cliente::withTrashed()->whereIn('id', $ids['cliente_id'])->pluck('razon_social', 'id')->all(),
            'marca_id' => Marca::whereIn('id', $ids['marca_id'])->pluck('marca', 'id')->all(),
            'proveedor_id' => Proveedor::withTrashed()->whereIn('id', $ids['proveedor_id'])->pluck('nombre_proveedor', 'id')->all(),
            'producto_id' => Producto::withTrashed()->whereIn('id', $ids['producto_id'])->pluck('concatenar_codigo_nombre', 'id')->all(),
            'user_id' => $usuarios,
            'vendedor_id' => $usuarios,
            'bodega_id' => $bodegas,
            'bodega_donante_id' => $bodegas,
            'bodega_destino_id' => $bodegas,
            'puc_id' => Puc::whereIn('id', $ids['puc_id'])->pluck('concatenar_subcuenta_concepto', 'id')->all(),
        ];
    }
}
