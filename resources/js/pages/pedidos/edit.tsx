import PedidoEditPage from '@/components/pedido-edit-page';
import * as pedidosAbonosRoutes from '@/routes/pedidos/abonos';
import * as pedidosRoutes from '@/routes/pedidos';
import { index } from '@/routes/pedidos';
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

export default function PedidoEdit(props: Props) {
    return (
        <PedidoEditPage
            {...props}
            routes={{ pedidos: pedidosRoutes, abonos: pedidosAbonosRoutes }}
            title="Pedidos"
        />
    );
}

PedidoEdit.layout = () => ({
    breadcrumbs: [
        {
            title: 'Pedidos',
            href: index(),
        },
        {
            title: 'Editar',
            href: '#',
        },
    ],
});
