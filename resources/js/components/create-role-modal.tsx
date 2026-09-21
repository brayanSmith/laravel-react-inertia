import { Form } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import RoleAccessFields from '@/components/role-access-fields';
import { Button } from '@/components/ui/button';
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
import { store } from '@/routes/roles';
import type { RoleBodegaOption } from '@/types';

type Props = PropsWithChildren<{
    permissions: string[];
    bodegas: RoleBodegaOption[];
}>;

export default function CreateRoleModal({
    permissions,
    bodegas,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [selectedBodegas, setSelectedBodegas] = useState<number[]>([]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setSelected([]);
            setSelectedBodegas([]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                <Form
                    key={String(open)}
                    {...store.form()}
                    className="space-y-6"
                    onSuccess={() => handleOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Crear un nuevo rol</DialogTitle>
                                <DialogDescription>
                                    Crea un rol personalizado y elige qué
                                    permisos otorgará.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="role-name">
                                    Nombre del rol
                                </Label>
                                <Input
                                    id="role-name"
                                    name="name"
                                    data-test="create-role-name"
                                    placeholder="Vendedor"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <RoleAccessFields
                                permissions={permissions}
                                selected={selected}
                                onChange={setSelected}
                                bodegas={bodegas}
                                selectedBodegas={selectedBodegas}
                                onBodegasChange={setSelectedBodegas}
                            />

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancelar
                                    </Button>
                                </DialogClose>

                                <Button
                                    type="submit"
                                    data-test="create-role-submit"
                                    disabled={processing}
                                >
                                    Crear rol
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
