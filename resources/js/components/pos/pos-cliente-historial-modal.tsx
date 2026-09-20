import PosPedidosHistorialModal from '@/components/pos/pos-pedidos-historial-modal';
import { voucher } from '@/routes/pos/pedidos';
import { pedidos as clientePedidos } from '@/routes/pos/clientes';
import type { ClienteOption } from '@/types';

type Props = {
    cliente: ClienteOption;
    teamSlug: string;
    onClose: () => void;
};

/** A single cliente's order history, filterable by date range. */
export default function PosClienteHistorialModal({
    cliente,
    teamSlug,
    onClose,
}: Props) {
    return (
        <PosPedidosHistorialModal
            title="Historial de pedidos"
            description={cliente.razon_social}
            buildRoute={({ desde, hasta, page }) =>
                clientePedidos([teamSlug, cliente.id], {
                    query: { desde, hasta, page },
                })
            }
            buildVoucherRoute={(pedidoId) => voucher([teamSlug, pedidoId])}
            onClose={onClose}
        />
    );
}
