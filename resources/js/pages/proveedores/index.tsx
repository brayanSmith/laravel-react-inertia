import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateProveedorModal from '@/components/create-proveedor-modal';
import DeleteProveedorModal from '@/components/delete-proveedor-modal';
import EditProveedorModal from '@/components/edit-proveedor-modal';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
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
import { index } from '@/routes/proveedores';
import type { Proveedor, ProveedorPermissions } from '@/types';

type Props = {
    proveedores: Proveedor[];
    permissions: ProveedorPermissions;
};

export default function ProveedoresIndex({ proveedores, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [proveedorToEdit, setProveedorToEdit] = useState<Proveedor | null>(
        null,
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [proveedorToDelete, setProveedorToDelete] =
        useState<Proveedor | null>(null);

    const teamSlug = currentTeam?.slug ?? '';

    const openEditDialog = (proveedor: Proveedor) => {
        setProveedorToEdit(proveedor);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (proveedor: Proveedor) => {
        setProveedorToDelete(proveedor);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Head title="Proveedores" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Proveedores"
                        description="Administra los proveedores registrados"
                    />

                    {permissions.canCreate ? (
                        <CreateProveedorModal teamSlug={teamSlug}>
                            <Button data-test="create-proveedor-button">
                                <Plus /> Nuevo proveedor
                            </Button>
                        </CreateProveedorModal>
                    ) : null}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>NIT</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Ciudad</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {proveedores.map((proveedor) => (
                            <TableRow
                                key={proveedor.id}
                                data-test="proveedor-row"
                            >
                                <TableCell>
                                    {proveedor.nombre_proveedor}
                                </TableCell>
                                <TableCell>{proveedor.nit_proveedor}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {proveedor.tipo_proveedor}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {proveedor.categoria_proveedor}
                                </TableCell>
                                <TableCell>
                                    {proveedor.ciudad_proveedor ?? '—'}
                                </TableCell>
                                <TableCell>
                                    {proveedor.telefono_proveedor ?? '—'}
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
                                                            data-test="edit-proveedor-button"
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    proveedor,
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
                                                            data-test="delete-proveedor-button"
                                                            onClick={() =>
                                                                openDeleteDialog(
                                                                    proveedor,
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

                {proveedores.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                        No hay proveedores registrados.
                    </p>
                ) : null}
            </div>

            <EditProveedorModal
                teamSlug={teamSlug}
                proveedor={proveedorToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteProveedorModal
                teamSlug={teamSlug}
                proveedor={proveedorToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

ProveedoresIndex.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Proveedores',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
