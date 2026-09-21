import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateClienteModal from '@/components/create-cliente-modal';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import DeleteClienteModal from '@/components/delete-cliente-modal';
import EditClienteModal from '@/components/edit-cliente-modal';
import Heading from '@/components/heading';
import RestoreButton from '@/components/restore-button';
import TrashToggle from '@/components/trash-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index, restore } from '@/routes/clientes';
import type { Cliente, ClientePermissions } from '@/types';

type Props = {
    clientes: Cliente[];
    eliminados: boolean;
    permissions: ClientePermissions;
};

export default function ClientesIndex({
    clientes,
    permissions,
    eliminados,
}: Props) {
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

    const columns = useMemo<DataTableColumn<Cliente>[]>(
        () => [
            {
                key: 'razon_social',
                label: 'Razón social',
                getValue: (cliente) => cliente.razon_social,
                render: (cliente) => cliente.razon_social,
            },
            {
                key: 'documento',
                label: 'Documento',
                getValue: (cliente) =>
                    `${cliente.tipo_documento} ${cliente.numero_documento}`,
                render: (cliente) =>
                    `${cliente.tipo_documento} ${cliente.numero_documento}`,
            },
            {
                key: 'telefono',
                label: 'Teléfono',
                getValue: (cliente) => cliente.telefono ?? '',
                render: (cliente) => cliente.telefono ?? '—',
            },
            {
                key: 'ciudad',
                label: 'Ciudad',
                getValue: (cliente) => cliente.ciudad ?? '',
                render: (cliente) => cliente.ciudad ?? '—',
            },
            {
                key: 'email',
                label: 'Email',
                getValue: (cliente) => cliente.email ?? '',
                render: (cliente) => cliente.email ?? '—',
            },
            {
                key: 'estado',
                label: 'Estado',
                filter: 'select',
                selectOptions: [
                    { value: 'activo', label: 'Activo' },
                    { value: 'inactivo', label: 'Inactivo' },
                ],
                getValue: (cliente) => (cliente.activo ? 'activo' : 'inactivo'),
                render: (cliente) => (
                    <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                ),
            },
            {
                key: 'acciones',
                label: 'Acciones',
                align: 'right',
                filter: 'none',
                render: (cliente) =>
                    eliminados ? (
                        permissions.canDelete ? (
                            <div className="flex justify-end">
                                <RestoreButton
                                    action={restore([teamSlug, cliente.id])}
                                    nombre={`el cliente ${cliente.razon_social}`}
                                    dataTest="restore-cliente-button"
                                />
                            </div>
                        ) : null
                    ) : (
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
                                                    openEditDialog(cliente)
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
                                                    openDeleteDialog(cliente)
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
        [permissions, eliminados, teamSlug],
    );

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

                    <div className="flex items-center gap-3">
                        <TrashToggle
                            eliminados={eliminados}
                            visible={permissions.canDelete}
                        />

                        {permissions.canCreate && !eliminados ? (
                            <CreateClienteModal teamSlug={teamSlug}>
                                <Button data-test="create-cliente-button">
                                    <Plus /> Nuevo cliente
                                </Button>
                            </CreateClienteModal>
                        ) : null}
                    </div>
                </div>

                <DataTable
                    data={clientes}
                    columns={columns}
                    getRowId={(cliente) => cliente.id}
                    dataTestPrefix="cliente"
                    searchPlaceholder="Buscar clientes..."
                    emptyMessage="No hay clientes registrados."
                />
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
