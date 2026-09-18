import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateTrasladoModal from '@/components/create-traslado-modal';
import DeleteTrasladoModal from '@/components/delete-traslado-modal';
import EditTrasladoModal from '@/components/edit-traslado-modal';
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
    const { currentTeam } = usePage().props;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [trasladoToEdit, setTrasladoToEdit] = useState<Traslado | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [trasladoToDelete, setTrasladoToDelete] = useState<Traslado | null>(
        null,
    );

    const teamSlug = currentTeam?.slug ?? '';

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
                            teamSlug={teamSlug}
                            productos={productos}
                            bodegas={bodegas}
                        >
                            <Button data-test="create-traslado-button">
                                <Plus /> Nuevo traslado
                            </Button>
                        </CreateTrasladoModal>
                    ) : null}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Bodega donante</TableHead>
                            <TableHead>Bodega destino</TableHead>
                            <TableHead className="text-right">
                                Cantidad
                            </TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {traslados.map((traslado) => (
                            <TableRow
                                key={traslado.id}
                                data-test="traslado-row"
                            >
                                <TableCell>{productoLabel(traslado)}</TableCell>
                                <TableCell>
                                    {traslado.bodega_donante?.nombre_bodega ??
                                        '—'}
                                </TableCell>
                                <TableCell>
                                    {traslado.bodega_destino?.nombre_bodega ??
                                        '—'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {traslado.cantidad}
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
                                                            data-test="edit-traslado-button"
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    traslado,
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
                                                            data-test="delete-traslado-button"
                                                            onClick={() =>
                                                                openDeleteDialog(
                                                                    traslado,
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

                {traslados.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                        No hay traslados registrados.
                    </p>
                ) : null}
            </div>

            <EditTrasladoModal
                teamSlug={teamSlug}
                productos={productos}
                bodegas={bodegas}
                traslado={trasladoToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteTrasladoModal
                teamSlug={teamSlug}
                traslado={trasladoToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

TrasladosIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Traslados',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
