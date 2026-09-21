import { Head } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateUsuarioModal from '@/components/create-usuario-modal';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import DeleteUsuarioModal from '@/components/delete-usuario-modal';
import EditUsuarioModal from '@/components/edit-usuario-modal';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index } from '@/routes/usuarios';
import type { Usuario, UsuarioPermissions, UsuarioRoleOption } from '@/types';

type Props = {
    usuarios: Usuario[];
    availableRoles: UsuarioRoleOption[];
    permissions: UsuarioPermissions;
};

export default function UsuariosIndex({
    usuarios,
    availableRoles,
    permissions,
}: Props) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [usuarioToEdit, setUsuarioToEdit] = useState<Usuario | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(
        null,
    );

    const openEditDialog = (usuario: Usuario) => {
        setUsuarioToEdit(usuario);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (usuario: Usuario) => {
        setUsuarioToDelete(usuario);
        setDeleteDialogOpen(true);
    };

    const rolesLabel = (usuario: Usuario) =>
        availableRoles
            .filter((role) => usuario.roles.includes(role.id))
            .map((role) => role.name)
            .join(', ');

    const columns = useMemo<DataTableColumn<Usuario>[]>(
        () => [
            {
                key: 'nombre',
                label: 'Nombre',
                getValue: (usuario) => usuario.name,
                render: (usuario) => usuario.name,
            },
            {
                key: 'email',
                label: 'Email',
                getValue: (usuario) => usuario.email,
                render: (usuario) => usuario.email,
            },
            {
                key: 'roles_personalizados',
                label: 'Roles',
                getValue: (usuario) => rolesLabel(usuario),
                render: (usuario) => {
                    const usuarioRoles = availableRoles.filter((role) =>
                        usuario.roles.includes(role.id),
                    );

                    return (
                        <div className="flex flex-wrap gap-1">
                            {usuarioRoles.length > 0 ? (
                                usuarioRoles.map((role) => (
                                    <Badge key={role.id}>{role.name}</Badge>
                                ))
                            ) : (
                                <span className="text-muted-foreground text-sm">
                                    —
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                key: 'acciones',
                label: 'Acciones',
                align: 'right',
                filter: 'none',
                render: (usuario) => (
                    <TooltipProvider>
                        <div className="flex justify-end gap-2">
                            {permissions.canUpdate ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="edit-usuario-button"
                                            onClick={() =>
                                                openEditDialog(usuario)
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
                                            data-test="delete-usuario-button"
                                            onClick={() =>
                                                openDeleteDialog(usuario)
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
        [permissions, availableRoles],
    );

    return (
        <>
            <Head title="Usuarios" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Usuarios"
                        description="Administra las cuentas de acceso y sus roles"
                    />

                    {permissions.canCreate ? (
                        <CreateUsuarioModal availableRoles={availableRoles}>
                            <Button data-test="create-usuario-button">
                                <Plus /> Nuevo usuario
                            </Button>
                        </CreateUsuarioModal>
                    ) : null}
                </div>

                <DataTable
                    data={usuarios}
                    columns={columns}
                    getRowId={(usuario) => usuario.id}
                    dataTestPrefix="usuario"
                    searchPlaceholder="Buscar usuarios..."
                    emptyMessage="No hay usuarios registrados."
                />
            </div>

            <EditUsuarioModal
                availableRoles={availableRoles}
                usuario={usuarioToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteUsuarioModal
                usuario={usuarioToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

UsuariosIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Usuarios',
            href: index(),
        },
    ],
});
