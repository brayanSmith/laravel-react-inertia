import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import DeleteProductoModal from '@/components/delete-producto-modal';
import ProductoFormFields from '@/components/producto-form-fields';
import { Button } from '@/components/ui/button';
import { index, show, update } from '@/routes/productos';
import type { MarcaOption, Producto } from '@/types';

type Props = {
    producto: Producto;
    marcas: MarcaOption[];
    permissions: { canDelete: boolean };
};

export default function ProductoEdit({ producto, marcas, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleImageChange = (file: File | null, removed: boolean) => {
        setRemoveImage(removed);

        if (!fileInputRef.current) {
            return;
        }

        const dataTransfer = new DataTransfer();

        if (file) {
            dataTransfer.items.add(file);
        }

        fileInputRef.current.files = dataTransfer.files;
    };

    const nombre = producto.concatenar_codigo_nombre || 'Producto';

    return (
        <>
            <Head title={`Editar ${nombre}`} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-muted-foreground text-sm">
                        <Link href={index(teamSlug)}>Productos</Link> {'>'}{' '}
                        {nombre} {'>'} Editar
                    </div>
                    <h1 className="text-2xl font-bold">Editar {nombre}</h1>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={show([teamSlug, producto.id])}>Ver</Link>
                    </Button>
                    {permissions.canDelete ? (
                        <Button
                            variant="destructive"
                            data-test="producto-delete-button"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            Borrar
                        </Button>
                    ) : null}
                </div>
            </div>

            <Form
                {...update.form([teamSlug, producto.id])}
                className="space-y-6"
            >
                {({ errors, processing }) => (
                    <>
                        <ProductoFormFields
                            producto={producto}
                            marcas={marcas}
                            errors={errors}
                            onImageChange={handleImageChange}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="imagen_producto"
                            className="hidden"
                        />
                        <input
                            type="hidden"
                            name="remove_imagen_producto"
                            value={removeImage ? '1' : '0'}
                        />

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit(index(teamSlug))}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                data-test="producto-submit"
                                disabled={processing}
                            >
                                Guardar Producto
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            <DeleteProductoModal
                teamSlug={teamSlug}
                producto={producto}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

ProductoEdit.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Productos',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
