import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateBodegaModal from '@/components/create-bodega-modal';
import DeleteBodegaModal from '@/components/delete-bodega-modal';
import EditBodegaModal from '@/components/edit-bodega-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bodegas.map((bodega) => (
                            <TableRow key={bodega.id} data-test="bodega-row">
                                <TableCell>{bodega.nombre_bodega}</TableCell>
                                <TableCell>
                                    {bodega.ubicacion_bodega ?? '—'}
                                </TableCell>
                                <TableCell className="text-right">
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
                                                                openEditDialog(
                                                                    bodega,
                                                                )
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
                                                                openDeleteDialog(
                                                                    bodega,
                                                                )
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
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {bodegas.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                        No hay bodegas registradas.
                    </p>
                ) : null}
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
