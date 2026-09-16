import { Form } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
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
import { store } from '@/routes/clientes';

type Props = PropsWithChildren<{
    currentTeamSlug: string;
}>;

export default function CreateClienteModal({
    children,
    currentTeamSlug,
}: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <Form
                    key={String(open)}
                    {...store.form(currentTeamSlug)}
                    className="space-y-6"
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Nuevo cliente</DialogTitle>
                                <DialogDescription>
                                    Agrega un nuevo cliente a tu lista.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre">Nombre</Label>
                                    <Input
                                        id="nombre"
                                        name="nombre"
                                        data-test="cliente-nombre"
                                        placeholder="Juan"
                                        required
                                    />
                                    <InputError message={errors.nombre} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="apellido">Apellido</Label>
                                    <Input
                                        id="apellido"
                                        name="apellido"
                                        data-test="cliente-apellido"
                                        placeholder="Pérez"
                                        required
                                    />
                                    <InputError message={errors.apellido} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="n_documento">
                                    N.º de documento
                                </Label>
                                <Input
                                    id="n_documento"
                                    name="n_documento"
                                    data-test="cliente-n-documento"
                                    placeholder="00000000"
                                    required
                                />
                                <InputError message={errors.n_documento} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Correo electrónico
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    data-test="cliente-email"
                                    placeholder="cliente@correo.com"
                                    required
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="telefono">Teléfono</Label>
                                <Input
                                    id="telefono"
                                    name="telefono"
                                    data-test="cliente-telefono"
                                    placeholder="0000-0000"
                                />
                                <InputError message={errors.telefono} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="direccion">Dirección</Label>
                                <Input
                                    id="direccion"
                                    name="direccion"
                                    data-test="cliente-direccion"
                                    placeholder="Dirección"
                                />
                                <InputError message={errors.direccion} />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancelar
                                    </Button>
                                </DialogClose>

                                <Button
                                    type="submit"
                                    data-test="create-cliente-submit"
                                    disabled={processing}
                                >
                                    Crear cliente
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
