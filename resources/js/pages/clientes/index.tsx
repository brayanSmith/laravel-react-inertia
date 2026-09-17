import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateClienteModal from '@/components/create-cliente-modal';
import DeleteClienteModal from '@/components/delete-cliente-modal';
import EditClienteModal from '@/components/edit-cliente-modal';
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
import { index } from '@/routes/clientes';
import type { Cliente, ClientePermissions } from '@/types';

type Props = {
    clientes: Cliente[];
    permissions: ClientePermissions;
};

export default function ClientesIndex({ clientes, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(
        null,
    );

    const teamSlug = currentTeam?.slug ?? '';

    const openEditDialog = (cliente: Cliente) => {
        setClienteToEdit(cliente);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (cliente: Cliente) => {
        setClienteToDelete(cliente);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Head title="Clientes" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Clientes"
                        description="Administra los clientes registrados"
                    />

                    {permissions.canCreate ? (
                        <CreateClienteModal teamSlug={teamSlug}>
                            <Button data-test="create-cliente-button">
                                <Plus /> Nuevo cliente
                            </Button>
                        </CreateClienteModal>
                    ) : null}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Razón social</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Ciudad</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientes.map((cliente) => (
                            <TableRow
                                key={cliente.id}
                                data-test="cliente-row"
                            >
                                <TableCell>{cliente.razon_social}</TableCell>
                                <TableCell>
                                    {cliente.tipo_documento}{' '}
                                    {cliente.numero_documento}
                                </TableCell>
                                <TableCell>
                                    {cliente.telefono ?? '—'}
                                </TableCell>
                                <TableCell>{cliente.ciudad ?? '—'}</TableCell>
                                <TableCell>{cliente.email ?? '—'}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            cliente.activo
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {cliente.activo
                                            ? 'Activo'
                                            : 'Inactivo'}
                                    </Badge>
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
                                                            data-test="edit-cliente-button"
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    cliente,
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
                                                            data-test="delete-cliente-button"
                                                            onClick={() =>
                                                                openDeleteDialog(
                                                                    cliente,
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

                {clientes.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                        No hay clientes registrados.
                    </p>
                ) : null}
            </div>

            <EditClienteModal
                teamSlug={teamSlug}
                cliente={clienteToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteClienteModal
                teamSlug={teamSlug}
                cliente={clienteToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

ClientesIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Clientes',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
