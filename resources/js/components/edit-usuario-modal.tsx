import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { update } from '@/routes/usuarios';
import type { RoleOption, TeamRole, Usuario, UsuarioRoleOption } from '@/types';

type Props = {
    teamSlug: string;
    availableTeamRoles: RoleOption[];
    availableRoles: UsuarioRoleOption[];
    usuario: Usuario | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditUsuarioModal({
    teamSlug,
    availableTeamRoles,
    availableRoles,
    usuario,
    open,
    onOpenChange,
}: Props) {
    const [teamRole, setTeamRole] = useState('member');
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

    useEffect(() => {
        if (!usuario) {
            return;
        }

        setTeamRole(usuario.team_role);
        setSelectedRoles(usuario.roles);
    }, [usuario]);

    const toggleRole = (roleId: number, checked: boolean) => {
        setSelectedRoles((current) =>
            checked
                ? [...current, roleId]
                : current.filter((id) => id !== roleId),
        );
    };

    if (!usuario) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <Form
                    key={String(open)}
                    {...update.form([teamSlug, usuario.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar usuario</DialogTitle>
                                <DialogDescription>
                                    Actualiza la información y los permisos de
                                    este usuario.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_usuario_name">
                                        Nombre
                                    </Label>
                                    <Input
                                        id="edit_usuario_name"
                                        name="name"
                                        data-test="edit-usuario-name"
                                        defaultValue={usuario.name}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_usuario_email">
                                        Email
                                    </Label>
                                    <Input
                                        id="edit_usuario_email"
                                        name="email"
                                        type="email"
                                        data-test="edit-usuario-email"
                                        defaultValue={usuario.email}
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_usuario_password">
                                        Nueva contraseña
                                    </Label>
                                    <PasswordInput
                                        id="edit_usuario_password"
                                        name="password"
                                        data-test="edit-usuario-password"
                                        placeholder="Dejar en blanco para no cambiarla"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_usuario_password_confirmation">
                                        Confirmar contraseña
                                    </Label>
                                    <PasswordInput
                                        id="edit_usuario_password_confirmation"
                                        name="password_confirmation"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Rol del equipo</Label>
                                    <Select
                                        value={teamRole}
                                        onValueChange={(value) =>
                                            setTeamRole(value as TeamRole)
                                        }
                                    >
                                        <SelectTrigger
                                            data-test="edit-usuario-team-role"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTeamRoles.map((role) => (
                                                <SelectItem
                                                    key={role.value}
                                                    value={role.value}
                                                >
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input
                                        type="hidden"
                                        name="team_role"
                                        value={teamRole}
                                    />
                                    <InputError message={errors.team_role} />
                                </div>

                                {availableRoles.length > 0 ? (
                                    <div className="grid gap-2">
                                        <Label>Roles personalizados</Label>
                                        <div className="flex flex-wrap gap-3">
                                            {availableRoles.map((role) => (
                                                <label
                                                    key={role.id}
                                                    className="flex items-center gap-2 text-sm"
                                                >
                                                    <Checkbox
                                                        checked={selectedRoles.includes(
                                                            role.id,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            toggleRole(
                                                                role.id,
                                                                checked ===
                                                                    true,
                                                            )
                                                        }
                                                    />
                                                    {role.name}
                                                </label>
                                            ))}
                                        </div>
                                        {selectedRoles.map((roleId) => (
                                            <input
                                                key={roleId}
                                                type="hidden"
                                                name="roles[]"
                                                value={roleId}
                                            />
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancelar
                                    </Button>
                                </DialogClose>

                                <Button
                                    type="submit"
                                    data-test="edit-usuario-submit"
                                    disabled={processing}
                                >
                                    Guardar cambios
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
