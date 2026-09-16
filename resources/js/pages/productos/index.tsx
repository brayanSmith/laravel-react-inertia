import { Head, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import CreateProductoModal from '@/components/create-producto-modal';
import DeleteProductoModal from '@/components/delete-producto-modal';
import EditProductoModal from '@/components/edit-producto-modal';
import Heading from '@/components/heading';
import ProductosTable from '@/components/productos-table';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/productos';
import type { CategoriaWithSubCategorias, Producto } from '@/types';

type Props = {
    productos: Producto[];
    categorias: CategoriaWithSubCategorias[];
};

export default function ProductosIndex({ productos, categorias }: Props) {
    const { currentTeam } = usePage().props;
    const currentTeamSlug = currentTeam?.slug ?? '';

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [productoEditing, setProductoEditing] = useState<Producto | null>(
        null,
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productoDeleting, setProductoDeleting] = useState<Producto | null>(
        null,
    );

    const openEditDialog = (producto: Producto) => {
        setProductoEditing(producto);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (producto: Producto) => {
        setProductoDeleting(producto);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Head title="Productos" />

            <h1 className="sr-only">Productos</h1>

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Productos"
                        description="Administra el inventario de productos de tu equipo"
                    />

                    <CreateProductoModal
                        currentTeamSlug={currentTeamSlug}
                        categorias={categorias}
                    >
                        <Button data-test="productos-new-producto-button">
                            <Plus /> Nuevo producto
                        </Button>
                    </CreateProductoModal>
                </div>

                <ProductosTable
                    productos={productos}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                />
            </div>

            <EditProductoModal
                currentTeamSlug={currentTeamSlug}
                producto={productoEditing}
                categorias={categorias}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteProductoModal
                currentTeamSlug={currentTeamSlug}
                producto={productoDeleting}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

ProductosIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Productos',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
