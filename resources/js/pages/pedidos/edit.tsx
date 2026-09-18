import { Form, Head, Link, usePage } from '@inertiajs/react';
import PedidoAbonosCard from '@/components/pedido-abonos-card';
import PedidoFormFields from '@/components/pedido-form-fields';
import { Button } from '@/components/ui/button';
import { index, update } from '@/routes/pedidos';
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

export default function PedidoEdit({
    pedido,
    clientes,
    productos,
    bodegas,
    vendedores,
    pucs,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    return (
        <>
            <Head title="Editar pedido" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-muted-foreground text-sm">
                        <Link href={index(teamSlug)}>Pedidos</Link> {'>'}{' '}
                        Editar
                    </div>
                    <h1 className="text-2xl font-bold">Editar pedido</h1>
                </div>
            </div>

            <div className="space-y-6">
                <PedidoAbonosCard
                    teamSlug={teamSlug}
                    pedido={pedido}
                    pucs={pucs}
                    vendedores={vendedores}
                />

                <Form
                    {...update.form([teamSlug, pedido.id])}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <PedidoFormFields
                            pedido={pedido}
                            clientes={clientes}
                            productos={productos}
                            bodegas={bodegas}
                            vendedores={vendedores}
                            errors={errors}
                            actions={
                                <>
                                    <Button variant="outline" asChild>
                                        <Link href={index(teamSlug)}>
                                            Cancelar
                                        </Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        data-test="pedido-submit"
                                        disabled={processing}
                                    >
                                        Guardar Pedido
                                    </Button>
                                </>
                            }
                        />
                    )}
                </Form>
            </div>
        </>
    );
}

PedidoEdit.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Pedidos',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
        {
            title: 'Editar',
            href: '#',
        },
    ],
});
