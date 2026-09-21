import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateTrasladoModal from '@/components/create-traslado-modal';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import DeleteTrasladoModal from '@/components/delete-traslado-modal';
import EditTrasladoModal from '@/components/edit-traslado-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index } from '@/routes/traslados';
import type {
    Bodega,
    ProductoOption,
    Traslado,
    TrasladoPermissions,
} from '@/types';

type Props = {
    traslados: Traslado[];
    productos: ProductoOption[];
    bodegas: Bodega[];
    permissions: TrasladoPermissions;
};

export default function TrasladosIndex({
    traslados,
    productos,
    bodegas,
    permissions,
}: Props) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [trasladoToEdit, setTrasladoToEdit] = useState<Traslado | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [trasladoToDelete, setTrasladoToDelete] = useState<Traslado | null>(
        null,
    );

    const openEditDialog = (traslado: Traslado) => {
        setTrasladoToEdit(traslado);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (traslado: Traslado) => {
        setTrasladoToDelete(traslado);
        setDeleteDialogOpen(true);
    };

    const productoLabel = (traslado: Traslado) =>
        traslado.producto?.concatenar_codigo_nombre ??
        traslado.producto?.referencia_producto ??
        `Producto ${traslado.producto_id}`;

    const columns = useMemo<DataTableColumn<Traslado>[]>(
        () => [
            {
                key: 'producto',
                label: 'Producto',
                getValue: (traslado) => productoLabel(traslado),
                render: (traslado) => productoLabel(traslado),
            },
            {
                key: 'bodega_donante',
                label: 'Bodega donante',
                getValue: (traslado) =>
                    traslado.bodega_donante?.nombre_bodega ?? '',
                render: (traslado) =>
                    traslado.bodega_donante?.nombre_bodega ?? '—',
            },
            {
                key: 'bodega_destino',
                label: 'Bodega destino',
                getValue: (traslado) =>
                    traslado.bodega_destino?.nombre_bodega ?? '',
                render: (traslado) =>
                    traslado.bodega_destino?.nombre_bodega ?? '—',
            },
            {
                key: 'cantidad',
                label: 'Cantidad',
                align: 'right',
                getValue: (traslado) => Number(traslado.cantidad),
                render: (traslado) => traslado.cantidad,
            },
            {
                key: 'acciones',
                label: 'Acciones',
                align: 'right',
                filter: 'none',
                render: (traslado) => (
                    <TooltipProvider>
                        <div className="flex justify-end gap-2">
                            {permissions.canUpdate ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="edit-traslado-button"
                                            onClick={() =>
                                                openEditDialog(traslado)
                                            }
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Editar</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}

                            {permissions.canDelete ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="delete-traslado-button"
                                            onClick={() =>
                                                openDeleteDialog(traslado)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Eliminar</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}
                        </div>
                    </TooltipProvider>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [permissions],
    );

    return (
        <>
            <Head title="Traslados" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Traslados"
                        description="Administra los traslados de productos entre bodegas"
                    />

                    {permissions.canCreate ? (
                        <CreateTrasladoModal
                            productos={productos}
                            bodegas={bodegas}
                        >
                            <Button data-test="create-traslado-button">
                                <Plus /> Nuevo traslado
                            </Button>
                        </CreateTrasladoModal>
                    ) : null}
                </div>

                <DataTable
                    data={traslados}
                    columns={columns}
                    getRowId={(traslado) => traslado.id}
                    dataTestPrefix="traslado"
                    searchPlaceholder="Buscar traslados..."
                    emptyMessage="No hay traslados registrados."
                />
            </div>

            <EditTrasladoModal
                productos={productos}
                bodegas={bodegas}
                traslado={trasladoToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteTrasladoModal
                traslado={trasladoToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

TrasladosIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Traslados',
            href: index(),
        },
    ],
});
