import { Head } from '@inertiajs/react';
import DashboardCharts from '@/components/dashboard-charts';
import DashboardFilters from '@/components/dashboard-filters';
import DashboardStockAlert from '@/components/dashboard-stock-alert';
import DashboardWidgets from '@/components/dashboard-widgets';
import CantidadPorBodegaTable from '@/components/cantidad-por-bodega-table';
import { dashboard } from '@/routes';
import type {
    CantidadPorBodega,
    DashboardBodegaOption,
    DashboardFiltros,
    DashboardGraficos,
    DashboardPermisos,
    DashboardProductoOption,
    DashboardResumen,
    ProductoSinStock,
} from '@/types';

type Props = {
    cantidadPorBodega: CantidadPorBodega | null;
    resumen: DashboardResumen | null;
    graficos: DashboardGraficos | null;
    permisos: DashboardPermisos;
    sinStock: ProductoSinStock[] | null;
    filtros: DashboardFiltros;
    bodegas: DashboardBodegaOption[];
    productosFiltro: DashboardProductoOption[];
};

export default function Dashboard({
    cantidadPorBodega,
    resumen,
    graficos,
    permisos,
    sinStock,
    filtros,
    bodegas,
    productosFiltro,
}: Props) {
    return (
        <>
            <Head title="Panel" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl">
                {sinStock ? <DashboardStockAlert productos={sinStock} /> : null}
                <DashboardFilters
                    filtros={filtros}
                    bodegas={bodegas}
                    productos={productosFiltro}
                />
                {resumen ? (
                    <DashboardWidgets resumen={resumen} permisos={permisos} />
                ) : null}
                {cantidadPorBodega ? (
                    <CantidadPorBodegaTable data={cantidadPorBodega} />
                ) : null}
                {graficos ? (
                    <DashboardCharts graficos={graficos} permisos={permisos} />
                ) : null}
            </div>
        </>
    );
}

Dashboard.layout = () => ({
    breadcrumbs: [
        {
            title: 'Panel',
            href: dashboard(),
        },
    ],
});
