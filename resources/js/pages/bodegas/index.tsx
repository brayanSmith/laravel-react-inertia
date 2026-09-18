import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateBodegaModal from '@/components/create-bodega-modal';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import DeleteBodegaModal from '@/components/delete-bodega-modal';
import EditBodegaModal from '@/components/edit-bodega-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index } from '@/routes/bodegas';
import type { Bodega, BodegaPermissions } from '@/types';

type Props = {
    bodegas: Bodega[];
    permissions: BodegaPermissions;
};

export default function BodegasIndex({ bodegas, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [bodegaToEdit, setBodegaToEdit] = useState<Bodega | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bodegaToDelete, setBodegaToDelete] = useState<Bodega | null>(null);

    const teamSlug = currentTeam?.slug ?? '';

    const openEditDialog = (bodega: Bodega) => {
        setBodegaToEdit(bodega);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (bodega: Bodega) => {
        setBodegaToDelete(bodega);
        setDeleteDialogOpen(true);
    };

    const columns = useMemo<DataTableColumn<Bodega>[]>(
        () => [
            {
                key: 'nombre',
                label: 'Nombre',
                getValue: (bodega) => bodega.nombre_bodega,
                render: (bodega) => bodega.nombre_bodega,
            },
            {
                key: 'ubicacion',
                label: 'Ubicación',
                getValue: (bodega) => bodega.ubicacion_bodega ?? '',
                render: (bodega) => bodega.ubicacion_bodega ?? '—',
            },
            {
                key: 'acciones',
                label: 'Acciones',
                align: 'right',
                filter: 'none',
                render: (bodega) => (
                    <TooltipProvider>
                        <div className="flex justify-end gap-2">
                            {permissions.canUpdate ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="edit-bodega-button"
                                            onClick={() =>
                                                openEditDialog(bodega)
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
                                            data-test="delete-bodega-button"
                                            onClick={() =>
                                                openDeleteDialog(bodega)
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
        [permissions],
    );

    return (
        <>
            <Head title="Bodegas" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Bodegas"
                        description="Administra las bodegas del inventario"
                    />

                    {permissions.canCreate ? (
                        <CreateBodegaModal teamSlug={teamSlug}>
                            <Button data-test="create-bodega-button">
                                <Plus /> Nueva bodega
                            </Button>
                        </CreateBodegaModal>
                    ) : null}
                </div>

                <DataTable
                    data={bodegas}
                    columns={columns}
                    getRowId={(bodega) => bodega.id}
                    dataTestPrefix="bodega"
                    searchPlaceholder="Buscar bodegas..."
                    emptyMessage="No hay bodegas registradas."
                />
            </div>

            <EditBodegaModal
                teamSlug={teamSlug}
                bodega={bodegaToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteBodegaModal
                teamSlug={teamSlug}
                bodega={bodegaToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

BodegasIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Bodegas',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
