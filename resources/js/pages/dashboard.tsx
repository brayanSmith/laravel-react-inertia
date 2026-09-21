import { Head } from '@inertiajs/react';
import { useState } from 'react';
import PendingInvitationsModal from '@/components/pending-invitations-modal';
import DashboardCharts from '@/components/dashboard-charts';
import DashboardFilters from '@/components/dashboard-filters';
import DashboardWidgets from '@/components/dashboard-widgets';
import CantidadPorBodegaTable from '@/components/cantidad-por-bodega-table';
import { dashboard } from '@/routes';
import type {
    CantidadPorBodega,
    DashboardBodegaOption,
    DashboardFiltros,
    DashboardGraficos,
    DashboardInvitation,
    DashboardProductoOption,
    DashboardResumen,
} from '@/types';

type Props = {
    pendingInvitations?: DashboardInvitation[];
    cantidadPorBodega: CantidadPorBodega;
    resumen: DashboardResumen;
    graficos: DashboardGraficos;
    filtros: DashboardFiltros;
    bodegas: DashboardBodegaOption[];
    productosFiltro: DashboardProductoOption[];
};

export default function Dashboard({
    pendingInvitations = [],
    cantidadPorBodega,
    resumen,
    graficos,
    filtros,
    bodegas,
    productosFiltro,
}: Props) {
    const [showInvitations, setShowInvitations] = useState(
        pendingInvitations.length > 0,
    );

    return (
        <>
            <Head title="Panel" />
            <PendingInvitationsModal
                invitations={pendingInvitations}
                open={pendingInvitations.length > 0 && showInvitations}
                onOpenChange={setShowInvitations}
            />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <DashboardFilters
                    filtros={filtros}
                    bodegas={bodegas}
                    productos={productosFiltro}
                />
                <DashboardWidgets resumen={resumen} />
                <CantidadPorBodegaTable data={cantidadPorBodega} />
                <DashboardCharts graficos={graficos} />
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Panel',
            href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/',
        },
    ],
});
