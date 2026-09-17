import { Head } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateUsuarioModal from '@/components/create-usuario-modal';
import DeleteUsuarioModal from '@/components/delete-usuario-modal';
import EditUsuarioModal from '@/components/edit-usuario-modal';
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
import { index } from '@/routes/usuarios';
import type {
    RoleOption,
    Usuario,
    UsuarioPermissions,
    UsuarioRoleOption,
} from '@/types';

type Props = {
    team: { slug: string };
    usuarios: Usuario[];
    availableTeamRoles: RoleOption[];
    availableRoles: UsuarioRoleOption[];
    permissions: UsuarioPermissions;
};

export default function UsuariosIndex({
    team,
    usuarios,
    availableTeamRoles,
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

    return (
        <>
            <Head title="Usuarios" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Usuarios"
                        description="Administra las cuentas de acceso de tu equipo"
                    />

                    {permissions.canCreate ? (
                        <CreateUsuarioModal
                            teamSlug={team.slug}
                            availableTeamRoles={availableTeamRoles}
                            availableRoles={availableRoles}
                        >
                            <Button data-test="create-usuario-button">
                                <Plus /> Nuevo usuario
                            </Button>
                        </CreateUsuarioModal>
                    ) : null}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol de equipo</TableHead>
                            <TableHead>Roles personalizados</TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usuarios.map((usuario) => {
                            const usuarioRoles = availableRoles.filter((role) =>
                                usuario.roles.includes(role.id),
                            );

                            return (
                                <TableRow
                                    key={usuario.id}
                                    data-test="usuario-row"
                                >
                                    <TableCell>{usuario.name}</TableCell>
                                    <TableCell>{usuario.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {usuario.team_role_label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {usuarioRoles.length > 0 ? (
                                                usuarioRoles.map((role) => (
                                                    <Badge key={role.id}>
                                                        {role.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground text-sm">
                                                    —
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {usuario.is_owner ? (
                                            <Badge variant="outline">
                                                Owner
                                            </Badge>
                                        ) : (
                                            <TooltipProvider>
                                                <div className="flex justify-end gap-2">
                                                    {permissions.canUpdate ? (
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    data-test="edit-usuario-button"
                                                                    onClick={() =>
                                                                        openEditDialog(
                                                                            usuario,
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
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    data-test="delete-usuario-button"
                                                                    onClick={() =>
                                                                        openDeleteDialog(
                                                                            usuario,
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
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {usuarios.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                        No hay usuarios registrados.
                    </p>
                ) : null}
            </div>

            <EditUsuarioModal
                teamSlug={team.slug}
                availableTeamRoles={availableTeamRoles}
                availableRoles={availableRoles}
                usuario={usuarioToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteUsuarioModal
                teamSlug={team.slug}
                usuario={usuarioToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

UsuariosIndex.layout = (props: { team: { slug: string } }) => ({
    breadcrumbs: [
        {
            title: 'Usuarios',
            href: index(props.team.slug),
        },
    ],
});
