import { Form, Head, Link, usePage } from '@inertiajs/react';
import PedidoFormFields from '@/components/pedido-form-fields';
import { Button } from '@/components/ui/button';
import { index, store } from '@/routes/pedidos';
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

export default function PedidoCreate({
    clientes,
    productos,
    bodegas,
    vendedores,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    return (
        <>
            <Head title="Nuevo pedido" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-muted-foreground text-sm">
                        <Link href={index(teamSlug)}>Pedidos</Link> {'>'} Crear
                    </div>
                    <h1 className="text-2xl font-bold">Nuevo pedido</h1>
                </div>
            </div>

            <Form {...store.form(teamSlug)} className="space-y-6">
                {({ errors, processing }) => (
                    <PedidoFormFields
                        clientes={clientes}
                        productos={productos}
                        bodegas={bodegas}
                        vendedores={vendedores}
                        errors={errors}
                        actions={
                            <>
                                <Button variant="outline" asChild>
                                    <Link href={index(teamSlug)}>Cancelar</Link>
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
        </>
    );
}

PedidoCreate.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Pedidos',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
        {
            title: 'Crear',
            href: '#',
        },
    ],
});
