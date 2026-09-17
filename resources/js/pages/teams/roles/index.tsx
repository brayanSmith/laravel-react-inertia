import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';
import CreateRoleModal from '@/components/create-role-modal';
import DeleteRoleModal from '@/components/delete-role-modal';
import EditRoleModal from '@/components/edit-role-modal';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { edit, index } from '@/routes/teams';
import { update as updateMemberRoles } from '@/routes/teams/members/roles';
import type { Role, RoleMember, Team } from '@/types';

type Props = {
    team: Team;
    roles: Role[];
    permissions: string[];
    members: RoleMember[];
};

export default function TeamRolesIndex({
    team,
    roles,
    permissions,
    members,
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

        router.visit(updateMemberRoles([team.slug, member.id]), {
            data: { roles: nextRoleIds },
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={`Roles - ${team.name}`} />

            <h1 className="sr-only">Roles para {team.name}</h1>

            <div className="flex flex-col space-y-10">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Heading
                            variant="small"
                            title="Roles personalizados"
                            description="Crea roles y elige qué permisos otorga cada uno"
                        />

                        <CreateRoleModal team={team} permissions={permissions}>
                            <Button data-test="create-role-button">
                                <Plus /> Crear rol
                            </Button>
                        </CreateRoleModal>
                    </div>

                    <div className="space-y-3">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                data-test="role-row"
                                className="flex items-center justify-between rounded-lg border p-4"
                            >
                                <div>
                                    <div className="font-medium">
                                        {role.name}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {role.permissions.length > 0 ? (
                                            role.permissions.map(
                                                (permission) => (
                                                    <Badge
                                                        key={permission}
                                                        variant="secondary"
                                                    >
                                                        {permission}
                                                    </Badge>
                                                ),
                                            )
                                        ) : (
                                            <span className="text-muted-foreground text-sm">
                                                No permissions assigned
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <TooltipProvider>
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    data-test="edit-role-button"
                                                    onClick={() =>
                                                        openEditDialog(role)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Editar rol</p>
                                            </TooltipContent>
                                        </Tooltip>

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
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Eliminar rol</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TooltipProvider>
                            </div>
                        ))}

                        {roles.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">
                                Aún no hay roles personalizados.
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Asignar roles a miembros"
                        description="Otorga roles personalizados para controlar lo que cada miembro puede acceder"
                    />

                    <div className="space-y-3">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                data-test="role-member-row"
                                className="space-y-2 rounded-lg border p-4"
                            >
                                <div>
                                    <div className="font-medium">
                                        {member.name}
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                        {member.email}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {roles.map((role) => {
                                        const hasRole = member.roles.includes(
                                            role.id,
                                        );

                                        return (
                                            <Badge
                                                key={role.id}
                                                data-test="role-toggle"
                                                variant={
                                                    hasRole
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    toggleMemberRole(
                                                        member,
                                                        role,
                                                        hasRole,
                                                    )
                                                }
                                            >
                                                {role.name}
                                            </Badge>
                                        );
                                    })}

                                    {roles.length === 0 ? (
                                        <span className="text-muted-foreground text-sm">
                                            Crea un rol arriba para asignarlo
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <EditRoleModal
                team={team}
                permissions={permissions}
                role={roleToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteRoleModal
                team={team}
                role={roleToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

TeamRolesIndex.layout = (props: { team: { name: string; slug: string } }) => ({
    breadcrumbs: [
        {
            title: 'Teams',
            href: index(),
        },
        {
            title: props.team.name,
            href: edit(props.team.slug),
        },
        {
            title: 'Roles',
            href: edit(props.team.slug),
        },
    ],
});
