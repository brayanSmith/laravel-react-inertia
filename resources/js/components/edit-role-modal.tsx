import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import PermissionsFieldset from '@/components/permissions-fieldset';
import { Button } from '@/components/ui/button';
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
import { update } from '@/routes/teams/roles';
import type { Role, Team } from '@/types';

type Props = {
    team: Team;
    permissions: string[];
    role: Role | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditRoleModal({
    team,
    permissions,
    role,
    open,
    onOpenChange,
}: Props) {
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        setSelected(role?.permissions ?? []);
    }, [role]);

    if (!role) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <Form
                    key={String(open)}
                    {...update.form([team.slug, role.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar rol</DialogTitle>
                                <DialogDescription>
                                    Actualiza el nombre del rol y sus permisos.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-role-name">
                                    Nombre del rol
                                </Label>
                                <Input
                                    id="edit-role-name"
                                    name="name"
                                    data-test="edit-role-name"
                                    defaultValue={role.name}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <PermissionsFieldset
                                permissions={permissions}
                                selected={selected}
                                onChange={setSelected}
                            />

                            {selected.map((permission) => (
                                <input
                                    key={permission}
                                    type="hidden"
                                    name="permissions[]"
                                    value={permission}
                                />
                            ))}

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancelar
                                    </Button>
                                </DialogClose>

                                <Button
                                    type="submit"
                                    data-test="edit-role-submit"
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
