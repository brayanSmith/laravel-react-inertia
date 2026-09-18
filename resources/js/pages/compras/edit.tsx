import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import CompraFormFields from '@/components/compra-form-fields';
import DeleteCompraModal from '@/components/delete-compra-modal';
import { Button } from '@/components/ui/button';
import { index, update } from '@/routes/compras';
import type {
    BodegaOption,
    Compra,
    ProductoOption,
    ProveedorOption,
} from '@/types';

type Props = {
    compra: Compra;
    proveedores: ProveedorOption[];
    productos: ProductoOption[];
    bodegas: BodegaOption[];
    permissions: { canDelete: boolean };
};

export default function CompraEdit({
    compra,
    proveedores,
    productos,
    bodegas,
    permissions,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    return (
        <>
            <Head title={`Editar compra ${compra.factura}`} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-muted-foreground text-sm">
                        <Link href={index(teamSlug)}>Compras</Link> {'>'}{' '}
                        {compra.factura} {'>'} Editar
                    </div>
                    <h1 className="text-2xl font-bold">
                        Editar compra {compra.factura}
                    </h1>
                </div>

                {permissions.canDelete ? (
                    <Button
                        variant="destructive"
                        data-test="compra-delete-button"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        Borrar
                    </Button>
                ) : null}
            </div>

            <Form {...update.form([teamSlug, compra.id])} className="space-y-6">
                {({ errors, processing }) => (
                    <CompraFormFields
                        compra={compra}
                        proveedores={proveedores}
                        productos={productos}
                        bodegas={bodegas}
                        errors={errors}
                        actions={
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.visit(index(teamSlug))
                                    }
                                >
                                    Cancelar
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

            <DeleteCompraModal
                teamSlug={teamSlug}
                compra={compra}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

CompraEdit.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Compras',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
