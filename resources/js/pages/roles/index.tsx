import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateRoleModal from '@/components/create-role-modal';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import DeleteRoleModal from '@/components/delete-role-modal';
import EditRoleModal from '@/components/edit-role-modal';
import Heading from '@/components/heading';
import TiposPrecioBadges from '@/components/tipos-precio-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index } from '@/routes/roles';
import { update as updateMemberRoles } from '@/routes/roles/members';
import type { Role, RoleBodegaOption, RoleMember } from '@/types';

type Props = {
    roles: Role[];
    permissions: string[];
    bodegas: RoleBodegaOption[];
    members: RoleMember[];
    permissionsFlags: {
        canCreate: boolean;
        canUpdate: boolean;
        canDelete: boolean;
    };
};

export default function RolesIndex({
    roles,
    permissions,
    bodegas,
    members,
    permissionsFlags,
}: Props) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const openEditDialog = (role: Role) => {
        setRoleToEdit(role);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (role: Role) => {
        setRoleToDelete(role);
        setDeleteDialogOpen(true);
    };

    const toggleMemberRole = (
        member: RoleMember,
        role: Role,
        hasRole: boolean,
    ) => {
        const nextRoleIds = hasRole
            ? member.roles.filter((id) => id !== role.id)
            : [...member.roles, role.id];

        router.visit(updateMemberRoles(member.id), {
            data: { roles: nextRoleIds },
            preserveScroll: true,
        });
    };

    const bodegasLabel = (role: Role) =>
        role.bodegas.length === 0
            ? 'Todas'
            : bodegas
                  .filter((bodega) => role.bodegas.includes(bodega.id))
                  .map((bodega) => bodega.nombre_bodega)
                  .join(', ');

    const memberCount = (role: Role) =>
        members.filter((member) => member.roles.includes(role.id)).length;

    const roleColumns = useMemo<DataTableColumn<Role>[]>(
        () => [
            {
                key: 'rol',
                label: 'Rol',
                getValue: (role) => role.name,
                render: (role) => (
                    <span className="font-medium">{role.name}</span>
                ),
            },
            {
                key: 'permisos',
                label: 'Permisos',
                filter: 'none',
                getValue: (role) => role.permissions.length,
                render: (role) => (
                    <Badge variant="secondary">
                        {role.permissions.length}{' '}
                        {role.permissions.length === 1 ? 'permiso' : 'permisos'}
                    </Badge>
                ),
            },
            {
                key: 'bodegas',
                label: 'Bodegas autorizadas',
                getValue: (role) => bodegasLabel(role),
                render: (role) =>
                    role.bodegas.length === 0 ? (
                        <span className="text-muted-foreground text-sm">
                            Todas
                        </span>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {bodegas
                                .filter((bodega) =>
                                    role.bodegas.includes(bodega.id),
                                )
                                .map((bodega) => (
                                    <Badge key={bodega.id} variant="outline">
                                        {bodega.nombre_bodega}
                                    </Badge>
                                ))}
                        </div>
                    ),
            },
            {
                key: 'miembros',
                label: 'Miembros',
                filter: 'none',
                getValue: (role) => memberCount(role),
                render: (role) => memberCount(role),
            },
            {
                key: 'acciones',
                label: 'Acciones',
                align: 'right',
                filter: 'none',
                render: (role) => (
                    <TooltipProvider>
                        <div className="flex justify-end gap-2">
                            {permissionsFlags.canUpdate ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="edit-role-button"
                                            onClick={() => openEditDialog(role)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Editar rol</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}

                            {permissionsFlags.canDelete ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="delete-role-button"
                                            onClick={() =>
                                                openDeleteDialog(role)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Eliminar rol</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}
                        </div>
                    </TooltipProvider>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [roles, members, bodegas, permissionsFlags],
    );

    const memberColumns = useMemo<DataTableColumn<RoleMember>[]>(
        () => [
            {
                key: 'nombre',
                label: 'Nombre',
                getValue: (member) => member.name,
                render: (member) => (
                    <span className="font-medium">{member.name}</span>
                ),
            },
            {
                key: 'email',
                label: 'Email',
                getValue: (member) => member.email,
                render: (member) => member.email,
            },
            {
                key: 'roles',
                label: 'Roles',
                getValue: (member) =>
                    roles
                        .filter((role) => member.roles.includes(role.id))
                        .map((role) => role.name)
                        .join(', '),
                render: (member) => (
                    <div className="flex flex-wrap gap-2">
                        {roles.map((role) => {
                            const hasRole = member.roles.includes(role.id);

                            return (
                                <Badge
                                    key={role.id}
                                    data-test="role-toggle"
                                    variant={hasRole ? 'default' : 'outline'}
                                    className={
                                        permissionsFlags.canUpdate
                                            ? 'cursor-pointer'
                                            : undefined
                                    }
                                    onClick={
                                        permissionsFlags.canUpdate
                                            ? () =>
                                                  toggleMemberRole(
                                                      member,
                                                      role,
                                                      hasRole,
                                                  )
                                            : undefined
                                    }
                                >
                                    {role.name}
                                </Badge>
                            );
                        })}
                    </div>
                ),
            },
            {
                key: 'precios',
                label: 'Precios permitidos',
                filter: 'none',
                getValue: (member) => member.tipos_precio_permitidos.join(', '),
                render: (member) => (
                    <TiposPrecioBadges
                        usuarioId={member.id}
                        selected={member.tipos_precio_permitidos}
                        canEdit={permissionsFlags.canUpdate}
                    />
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [roles, permissionsFlags],
    );

    return (
        <>
            <Head title="Roles y permisos" />

            <h1 className="sr-only">Roles y permisos</h1>

            <div className="flex flex-col space-y-10">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Heading
                            variant="small"
                            title="Roles"
                            description="Crea roles y elige qué permisos, bodegas y partes del panel otorga cada uno"
                        />

                        {permissionsFlags.canCreate ? (
                            <CreateRoleModal
                                permissions={permissions}
                                bodegas={bodegas}
                            >
                                <Button data-test="create-role-button">
                                    <Plus /> Crear rol
                                </Button>
                            </CreateRoleModal>
                        ) : null}
                    </div>

                    <DataTable
                        data={roles}
                        columns={roleColumns}
                        getRowId={(role) => role.id}
                        dataTestPrefix="role"
                        searchPlaceholder="Buscar roles..."
                        emptyMessage="Aún no hay roles."
                    />
                </div>

                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Asignar roles a usuarios"
                        description="Marca los roles de cada usuario haciendo clic en ellos"
                    />

                    <DataTable
                        data={members}
                        columns={memberColumns}
                        getRowId={(member) => member.id}
                        dataTestPrefix="role-member"
                        searchPlaceholder="Buscar usuarios..."
                        emptyMessage="No hay usuarios."
                    />
                </div>
            </div>

            <EditRoleModal
                permissions={permissions}
                bodegas={bodegas}
                role={roleToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteRoleModal
                role={roleToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

RolesIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Roles y permisos',
            href: index(),
        },
    ],
});
