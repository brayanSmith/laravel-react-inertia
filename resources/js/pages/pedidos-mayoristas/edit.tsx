import PedidoEditPage from '@/components/pedido-edit-page';
import * as pedidosMayoristasAbonosRoutes from '@/routes/pedidos-mayoristas/abonos';
import * as pedidosMayoristasRoutes from '@/routes/pedidos-mayoristas';
import { index } from '@/routes/pedidos-mayoristas';
import type {
    BodegaOption,
    ClienteOption,
    Pedido,
    PedidoEditPermissions,
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
    permissions: PedidoEditPermissions;
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

PedidoMayoristaEdit.layout = () => ({
    breadcrumbs: [
        {
            title: 'Pedidos Mayorista',
            href: index(),
        },
        {
            title: 'Editar',
            href: '#',
        },
    ],
});
