import { Form, Head, Link, usePage } from '@inertiajs/react';
import PedidoFormFields from '@/components/pedido-form-fields';
import { Button } from '@/components/ui/button';
import type {
    BodegaOption,
    ClienteOption,
    PedidoRoutes,
    ProductoPedidoOption,
    TipoPrecioPedido,
    VendedorOption,
} from '@/types';

type Props = {
    clientes: ClienteOption[];
    productos: ProductoPedidoOption[];
    bodegas: BodegaOption[];
    vendedores: VendedorOption[];
    defaultTipoPrecio?: TipoPrecioPedido;
    routes: PedidoRoutes;
    title: string;
};

export default function PedidoCreatePage({
    clientes,
    productos,
    bodegas,
    vendedores,
    defaultTipoPrecio,
    routes,
    title,
}: Props) {
    return (
        <>
            <Head title={title} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-muted-foreground text-sm">
                        <Link href={routes.pedidos.index()}>{title}</Link> {'>'}{' '}
                        Crear
                    </div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                </div>
            </div>

            <Form {...routes.pedidos.store.form()} className="space-y-6">
                {({ errors, processing }) => (
                    <PedidoFormFields
                        clientes={clientes}
                        productos={productos}
                        bodegas={bodegas}
                        vendedores={vendedores}
                        errors={errors}
                        defaultTipoPrecio={defaultTipoPrecio}
                        actions={
                            <>
                                <Button variant="outline" asChild>
                                    <Link href={routes.pedidos.index()}>
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
        </>
    );
}
