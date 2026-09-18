import { Form, Head, Link, usePage } from '@inertiajs/react';
import PedidoAbonosCard from '@/components/pedido-abonos-card';
import PedidoFormFields from '@/components/pedido-form-fields';
import { Button } from '@/components/ui/button';
import type {
    BodegaOption,
    ClienteOption,
    Pedido,
    PedidoRoutes,
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
    routes: PedidoRoutes;
    title: string;
};

export default function PedidoEditPage({
    pedido,
    clientes,
    productos,
    bodegas,
    vendedores,
    pucs,
    routes,
    title,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    return (
        <>
            <Head title={`Editar ${title.toLowerCase()}`} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-muted-foreground text-sm">
                        <Link href={routes.pedidos.index(teamSlug)}>
                            {title}
                        </Link>{' '}
                        {'>'} Editar
                    </div>
                    <h1 className="text-2xl font-bold">Editar pedido</h1>
                </div>
            </div>

            <div className="space-y-6">
                <PedidoAbonosCard
                    teamSlug={teamSlug}
                    pedido={pedido}
                    routes={routes}
                    pucs={pucs}
                    vendedores={vendedores}
                />

                <Form
                    {...routes.pedidos.update.form([teamSlug, pedido.id])}
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
                                        <Link
                                            href={routes.pedidos.index(
                                                teamSlug,
                                            )}
                                        >
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
