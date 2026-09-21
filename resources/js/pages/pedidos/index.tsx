import PedidosIndexPage from '@/components/pedidos-index-page';
import * as pedidosAbonosRoutes from '@/routes/pedidos/abonos';
import * as pedidosRoutes from '@/routes/pedidos';
import { index } from '@/routes/pedidos';
import type { Pedido, PedidoPermissions } from '@/types';

type Props = {
    pedidos: Pedido[];
    permissions: PedidoPermissions;
    eliminados: boolean;
};

export default function PedidosIndex({
    pedidos,
    permissions,
    eliminados,
}: Props) {
    return (
        <PedidosIndexPage
            pedidos={pedidos}
            permissions={permissions}
            eliminados={eliminados}
            routes={{ pedidos: pedidosRoutes, abonos: pedidosAbonosRoutes }}
            title="Pedidos"
            description="Administra los pedidos al detal de los clientes"
        />
    );
}

PedidosIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Pedidos',
            href: index(),
        },
    ],
});
