import { Form, Head, Link, usePage } from '@inertiajs/react';
import CompraFormFields from '@/components/compra-form-fields';
import { Button } from '@/components/ui/button';
import { index, store } from '@/routes/compras';
import type { BodegaOption, ProductoOption, ProveedorOption } from '@/types';

type Props = {
    proveedores: ProveedorOption[];
    productos: ProductoOption[];
    bodegas: BodegaOption[];
};

export default function CompraCreate({
    proveedores,
    productos,
    bodegas,
}: Props) {
    return (
        <>
            <Head title="Nueva compra" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-muted-foreground text-sm">
                        <Link href={index()}>Compras</Link> {'>'} Crear
                    </div>
                    <h1 className="text-2xl font-bold">Nueva compra</h1>
                </div>
            </div>

            <Form {...store.form()} className="space-y-6">
                {({ errors, processing }) => (
                    <CompraFormFields
                        proveedores={proveedores}
                        productos={productos}
                        bodegas={bodegas}
                        errors={errors}
                        actions={
                            <>
                                <Button variant="outline" asChild>
                                    <Link href={index()}>Cancelar</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    data-test="compra-submit"
                                    disabled={processing}
                                >
                                    Guardar Compra
                                </Button>
                            </>
                        }
                    />
                )}
            </Form>
        </>
    );
}

CompraCreate.layout = () => ({
    breadcrumbs: [
        {
            title: 'Compras',
            href: index(),
        },
        {
            title: 'Crear',
            href: '#',
        },
    ],
});
