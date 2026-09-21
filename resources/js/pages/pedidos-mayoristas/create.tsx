import PedidoCreatePage from '@/components/pedido-create-page';
import * as pedidosMayoristasAbonosRoutes from '@/routes/pedidos-mayoristas/abonos';
import * as pedidosMayoristasRoutes from '@/routes/pedidos-mayoristas';
import { index } from '@/routes/pedidos-mayoristas';
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

export default function PedidoMayoristaCreate(props: Props) {
    return (
        <PedidoCreatePage
            {...props}
            defaultTipoPrecio="MAYORISTA"
            routes={{
                pedidos: pedidosMayoristasRoutes,
                abonos: pedidosMayoristasAbonosRoutes,
            }}
            title="Pedidos Mayorista"
        />
    );
}

PedidoMayoristaCreate.layout = () => ({
    breadcrumbs: [
        {
            title: 'Pedidos Mayorista',
            href: index(),
        },
        {
            title: 'Crear',
            href: '#',
        },
    ],
});
