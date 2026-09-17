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
import { store } from '@/routes/marcas';

type Props = PropsWithChildren<{
    teamSlug: string;
}>;

export default function CreateMarcaModal({ teamSlug, children }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <Form
                    key={String(open)}
                    {...store.form(teamSlug)}
                    className="space-y-6"
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Nueva marca</DialogTitle>
                                <DialogDescription>
                                    Crea una nueva marca para el catálogo de
                                    productos.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="marca">Nombre</Label>
                                    <Input
                                        id="marca"
                                        name="marca"
                                        data-test="create-marca-nombre"
                                        required
                                    />
                                    <InputError message={errors.marca} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="descripcion_marca">
                                        Descripción
                                    </Label>
                                    <Input
                                        id="descripcion_marca"
                                        name="descripcion_marca"
                                        data-test="create-marca-descripcion"
                                    />
                                    <InputError
                                        message={errors.descripcion_marca}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancelar
                                    </Button>
                                </DialogClose>

                                <Button
                                    type="submit"
                                    data-test="create-marca-submit"
                                    disabled={processing}
                                >
                                    Crear marca
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
