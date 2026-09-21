import PedidosIndexPage from '@/components/pedidos-index-page';
import * as pedidosMayoristasAbonosRoutes from '@/routes/pedidos-mayoristas/abonos';
import * as pedidosMayoristasRoutes from '@/routes/pedidos-mayoristas';
import { index } from '@/routes/pedidos-mayoristas';
import type { Pedido, PedidoPermissions } from '@/types';

type Props = {
    pedidos: Pedido[];
    permissions: PedidoPermissions;
    eliminados: boolean;
};

export default function PedidosMayoristasIndex({
    pedidos,
    permissions,
    eliminados,
}: Props) {
    return (
        <PedidosIndexPage
            pedidos={pedidos}
            permissions={permissions}
            eliminados={eliminados}
            routes={{
                pedidos: pedidosMayoristasRoutes,
                abonos: pedidosMayoristasAbonosRoutes,
            }}
            title="Pedidos Mayorista"
            description="Administra los pedidos al por mayor de los clientes"
        />
    );
}

PedidosMayoristasIndex.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Pedidos Mayorista',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
