import { Form } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
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
    DialogTrigger,
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
import { store } from '@/routes/usuarios';
import type { RoleOption, TeamRole, UsuarioRoleOption } from '@/types';

type Props = PropsWithChildren<{
    teamSlug: string;
    availableTeamRoles: RoleOption[];
    availableRoles: UsuarioRoleOption[];
}>;

export default function CreateUsuarioModal({
    teamSlug,
    availableTeamRoles,
    availableRoles,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const [teamRole, setTeamRole] = useState(
        availableTeamRoles[0]?.value ?? 'member',
    );
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setTeamRole(availableTeamRoles[0]?.value ?? 'member');
            setSelectedRoles([]);
        }
    };

    const toggleRole = (roleId: number, checked: boolean) => {
        setSelectedRoles((current) =>
            checked
                ? [...current, roleId]
                : current.filter((id) => id !== roleId),
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <Form
                    key={String(open)}
                    {...store.form(teamSlug)}
                    className="space-y-6"
                    onSuccess={() => handleOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Nuevo usuario</DialogTitle>
                                <DialogDescription>
                                    Crea una cuenta de acceso para un
                                    empleado.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="usuario_name">
                                        Nombre
                                    </Label>
                                    <Input
                                        id="usuario_name"
                                        name="name"
                                        data-test="create-usuario-name"
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="usuario_email">
                                        Email
                                    </Label>
                                    <Input
                                        id="usuario_email"
                                        name="email"
                                        type="email"
                                        data-test="create-usuario-email"
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="usuario_password">
                                        Contraseña
                                    </Label>
                                    <PasswordInput
                                        id="usuario_password"
                                        name="password"
                                        data-test="create-usuario-password"
                                        required
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="usuario_password_confirmation">
                                        Confirmar contraseña
                                    </Label>
                                    <PasswordInput
                                        id="usuario_password_confirmation"
                                        name="password_confirmation"
                                        data-test="create-usuario-password-confirmation"
                                        required
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
                                            data-test="create-usuario-team-role"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTeamRoles.map(
                                                (role) => (
                                                    <SelectItem
                                                        key={role.value}
                                                        value={role.value}
                                                    >
                                                        {role.label}
                                                    </SelectItem>
                                                ),
                                            )}
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
                                    data-test="create-usuario-submit"
                                    disabled={processing}
                                >
                                    Crear usuario
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
