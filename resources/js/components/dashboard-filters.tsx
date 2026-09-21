import { router, usePage } from '@inertiajs/react';
import { BarChart3, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Combobox from '@/components/combobox';
import MultiCombobox from '@/components/multi-combobox';
import { Button } from '@/components/ui/button';
import { useTiposPrecio } from '@/hooks/use-tipos-precio';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import type {
    DashboardBodegaOption,
    DashboardFiltros,
    DashboardProductoOption,
} from '@/types';

type Props = {
    filtros: DashboardFiltros;
    bodegas: DashboardBodegaOption[];
    productos: DashboardProductoOption[];
};

const TIPOS_VEHICULO = [
    { value: '', label: 'Todos' },
    { value: 'CARRO', label: 'Carro' },
    { value: 'MOTO', label: 'Moto' },
];

/** Not a real bodega: groups the orders sold with the MAYORISTA price. */
const MAYORISTA = 'mayorista';

const SIN_FILTROS: DashboardFiltros = {
    bodega_ids: [],
    desde: '',
    hasta: '',
    tipo_vehiculo: '',
    producto_ids: [],
};

const estaVacio = (valor: string | string[]) =>
    Array.isArray(valor) ? valor.length === 0 : valor === '';

/**
 * Filters shared by the dashboard widgets and table. Changes stay in a draft
 * until "Analizar" is pressed, which sends them to the server through the
 * query string (so the view can be bookmarked).
 */
export default function DashboardFilters({
    filtros,
    bodegas,
    productos,
}: Props) {
    const [borrador, setBorrador] = useState<DashboardFiltros>(filtros);
    const [analizando, setAnalizando] = useState(false);

    // Follow the server (e.g. after clearing or navigating back).
    const filtrosKey = JSON.stringify(filtros);
    useEffect(() => {
        setBorrador(JSON.parse(filtrosKey) as DashboardFiltros);
    }, [filtrosKey]);

    const hayFiltros = Object.values(filtros).some(
        (valor) => !estaVacio(valor),
    );
    const hayCambios = JSON.stringify(borrador) !== filtrosKey;

    const { puedeMayorista } = useTiposPrecio();

    const bodegaOptions = useMemo(
        () => [
            ...bodegas.map((bodega) => ({
                value: String(bodega.id),
                label: bodega.nombre_bodega,
            })),
            ...(puedeMayorista
                ? [{ value: MAYORISTA, label: 'Mayorista' }]
                : []),
        ],
        [bodegas, puedeMayorista],
    );

    // The product list follows the selected vehicle type.
    const productoOptions = useMemo(
        () =>
            productos
                .filter(
                    (producto) =>
                        borrador.tipo_vehiculo === '' ||
                        producto.tipo_vehiculo === borrador.tipo_vehiculo,
                )
                .map((producto) => ({
                    value: String(producto.id),
                    label:
                        producto.concatenar_codigo_nombre ??
                        `Producto ${producto.id}`,
                })),
        [productos, borrador.tipo_vehiculo],
    );

    const cambiar = (cambios: Partial<DashboardFiltros>) =>
        setBorrador((prev) => {
            const siguiente = { ...prev, ...cambios };

            // Products from another vehicle type no longer apply.
            if ('tipo_vehiculo' in cambios) {
                siguiente.producto_ids = siguiente.producto_ids.filter((id) =>
                    productos.some(
                        (producto) =>
                            String(producto.id) === id &&
                            (siguiente.tipo_vehiculo === '' ||
                                producto.tipo_vehiculo ===
                                    siguiente.tipo_vehiculo),
                    ),
                );
            }

            return siguiente;
        });

    const analizar = (aplicados: DashboardFiltros) => {
        const query = Object.fromEntries(
            Object.entries(aplicados).filter(([, valor]) => !estaVacio(valor)),
        );

        router.get(dashboard.url(), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['cantidadPorBodega', 'resumen', 'graficos', 'filtros'],
            onStart: () => setAnalizando(true),
            onFinish: () => setAnalizando(false),
        });
    };

    const limpiar = () => {
        setBorrador(SIN_FILTROS);
        analizar(SIN_FILTROS);
    };

    return (
        <form
            className="bg-card space-y-3 rounded-xl border p-4"
            data-test="dashboard-filters"
            onSubmit={(event) => {
                event.preventDefault();
                analizar(borrador);
            }}
        >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="space-y-1.5">
                    <Label>Bodegas</Label>
                    <MultiCombobox
                        options={bodegaOptions}
                        value={borrador.bodega_ids}
                        onValueChange={(value) =>
                            cambiar({ bodega_ids: value })
                        }
                        placeholder="Todas"
                        searchPlaceholder="Buscar bodega..."
                        dataTest="dashboard-filter-bodega"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="dashboard-desde">Desde</Label>
                    <Input
                        id="dashboard-desde"
                        type="date"
                        value={borrador.desde}
                        max={borrador.hasta || undefined}
                        onChange={(event) =>
                            cambiar({ desde: event.target.value })
                        }
                        data-test="dashboard-filter-desde"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="dashboard-hasta">Hasta</Label>
                    <Input
                        id="dashboard-hasta"
                        type="date"
                        value={borrador.hasta}
                        min={borrador.desde || undefined}
                        onChange={(event) =>
                            cambiar({ hasta: event.target.value })
                        }
                        data-test="dashboard-filter-hasta"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label>Tipo de vehículo</Label>
                    <Combobox
                        options={TIPOS_VEHICULO}
                        value={borrador.tipo_vehiculo}
                        onValueChange={(value) =>
                            cambiar({ tipo_vehiculo: value })
                        }
                        placeholder="Todos"
                        dataTest="dashboard-filter-tipo-vehiculo"
                    />
                </div>

                <div className="space-y-1.5 xl:col-span-2">
                    <Label>Productos</Label>
                    <MultiCombobox
                        options={productoOptions}
                        value={borrador.producto_ids}
                        onValueChange={(value) =>
                            cambiar({ producto_ids: value })
                        }
                        placeholder="Todos"
                        searchPlaceholder="Buscar producto..."
                        dataTest="dashboard-filter-producto"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-2">
                {hayCambios ? (
                    <span className="text-muted-foreground text-xs">
                        Hay cambios sin aplicar
                    </span>
                ) : null}
                {hayFiltros || hayCambios ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={limpiar}
                        disabled={analizando}
                        data-test="dashboard-filter-clear"
                    >
                        <X />
                        Limpiar
                    </Button>
                ) : null}
                <Button
                    type="submit"
                    disabled={analizando}
                    data-test="dashboard-filter-analizar"
                >
                    <BarChart3 />
                    {analizando ? 'Analizando...' : 'Analizar'}
                </Button>
            </div>
        </form>
    );
}
