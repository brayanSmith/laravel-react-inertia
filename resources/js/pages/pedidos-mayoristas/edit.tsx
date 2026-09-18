import PedidoEditPage from '@/components/pedido-edit-page';
import * as pedidosMayoristasAbonosRoutes from '@/routes/pedidos-mayoristas/abonos';
import * as pedidosMayoristasRoutes from '@/routes/pedidos-mayoristas';
import { index } from '@/routes/pedidos-mayoristas';
import type {
    BodegaOption,
    ClienteOption,
    Pedido,
    PedidoPermissions,
    ProductoPedidoOption,
    PucOption,
    VendedorOption,
} from '@/types';

type Props = {
    pedido: Pedido;
    clientes: ClienteOption[];
    productos: ProductoPedidoOption[];
    bodegas: BodegaOption[];
    vendedores: VendedorOption[];
    pucs: PucOption[];
    permissions: PedidoPermissions;
};

export default function PedidoMayoristaEdit(props: Props) {
    return (
        <PedidoEditPage
            {...props}
            routes={{
                pedidos: pedidosMayoristasRoutes,
                abonos: pedidosMayoristasAbonosRoutes,
            }}
            title="Pedidos Mayorista"
        />
    );
}

PedidoMayoristaEdit.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Pedidos Mayorista',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
        {
            title: 'Editar',
            href: '#',
        },
    ],
});
