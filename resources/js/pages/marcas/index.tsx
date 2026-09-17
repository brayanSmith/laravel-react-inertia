import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateMarcaModal from '@/components/create-marca-modal';
import DeleteMarcaModal from '@/components/delete-marca-modal';
import EditMarcaModal from '@/components/edit-marca-modal';
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
import { index } from '@/routes/marcas';
import type { Marca, MarcaPermissions } from '@/types';

type Props = {
    marcas: Marca[];
    permissions: MarcaPermissions;
};

export default function MarcasIndex({ marcas, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [marcaToEdit, setMarcaToEdit] = useState<Marca | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [marcaToDelete, setMarcaToDelete] = useState<Marca | null>(null);

    const teamSlug = currentTeam?.slug ?? '';

    const openEditDialog = (marca: Marca) => {
        setMarcaToEdit(marca);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (marca: Marca) => {
        setMarcaToDelete(marca);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Head title="Marcas" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Marcas"
                        description="Administra las marcas del catálogo de productos"
                    />

                    {permissions.canCreate ? (
                        <CreateMarcaModal teamSlug={teamSlug}>
                            <Button data-test="create-marca-button">
                                <Plus /> Nueva marca
                            </Button>
                        </CreateMarcaModal>
                    ) : null}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {marcas.map((marca) => (
                            <TableRow key={marca.id} data-test="marca-row">
                                <TableCell>{marca.marca}</TableCell>
                                <TableCell>
                                    {marca.descripcion_marca ?? '—'}
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
                                                            data-test="edit-marca-button"
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    marca,
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
                                                            data-test="delete-marca-button"
                                                            onClick={() =>
                                                                openDeleteDialog(
                                                                    marca,
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

                {marcas.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                        No hay marcas registradas.
                    </p>
                ) : null}
            </div>

            <EditMarcaModal
                teamSlug={teamSlug}
                marca={marcaToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteMarcaModal
                teamSlug={teamSlug}
                marca={marcaToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

MarcasIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Marcas',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
