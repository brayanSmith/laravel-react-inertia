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
import { store } from '@/routes/bodegas';

type Props = PropsWithChildren<{
    teamSlug: string;
}>;

export default function CreateBodegaModal({ teamSlug, children }: Props) {
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
                                <DialogTitle>Nueva bodega</DialogTitle>
                                <DialogDescription>
                                    Crea una nueva bodega para el inventario.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre_bodega">
                                        Nombre
                                    </Label>
                                    <Input
                                        id="nombre_bodega"
                                        name="nombre_bodega"
                                        data-test="create-bodega-nombre"
                                        required
                                    />
                                    <InputError
                                        message={errors.nombre_bodega}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="ubicacion_bodega">
                                        Ubicación
                                    </Label>
                                    <Input
                                        id="ubicacion_bodega"
                                        name="ubicacion_bodega"
                                        data-test="create-bodega-ubicacion"
                                    />
                                    <InputError
                                        message={errors.ubicacion_bodega}
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
                                    data-test="create-bodega-submit"
                                    disabled={processing}
                                >
                                    Crear bodega
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
