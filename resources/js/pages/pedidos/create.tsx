import PedidoCreatePage from '@/components/pedido-create-page';
import * as pedidosAbonosRoutes from '@/routes/pedidos/abonos';
import * as pedidosRoutes from '@/routes/pedidos';
import { index } from '@/routes/pedidos';
import type {
    BodegaOption,
    ClienteOption,
    ProductoPedidoOption,
    VendedorOption,
} from '@/types';

type Props = {
    clientes: ClienteOption[];
    productos: ProductoPedidoOption[];
    bodegas: BodegaOption[];
    vendedores: VendedorOption[];
};

export default function PedidoCreate(props: Props) {
    return (
        <PedidoCreatePage
            {...props}
            defaultTipoPrecio="DETAL"
            routes={{ pedidos: pedidosRoutes, abonos: pedidosAbonosRoutes }}
            title="Pedidos"
        />
    );
}

PedidoCreate.layout = () => ({
    breadcrumbs: [
        {
            title: 'Pedidos',
            href: index(),
        },
        {
            title: 'Crear',
            href: '#',
        },
    ],
});
