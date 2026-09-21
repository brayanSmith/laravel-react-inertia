import { Form } from '@inertiajs/react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { update } from '@/routes/bodegas';
import type { Bodega } from '@/types';

type Props = {
    bodega: Bodega | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditBodegaModal({ bodega, open, onOpenChange }: Props) {
    if (!bodega) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Form
                    key={String(open)}
                    {...update.form([bodega.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar bodega</DialogTitle>
                                <DialogDescription>
                                    Actualiza los datos de la bodega.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_nombre_bodega">
                                        Nombre
                                    </Label>
                                    <Input
                                        id="edit_nombre_bodega"
                                        name="nombre_bodega"
                                        data-test="edit-bodega-nombre"
                                        defaultValue={bodega.nombre_bodega}
                                        required
                                    />
                                    <InputError
                                        message={errors.nombre_bodega}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_ubicacion_bodega">
                                        Ubicación
                                    </Label>
                                    <Input
                                        id="edit_ubicacion_bodega"
                                        name="ubicacion_bodega"
                                        data-test="edit-bodega-ubicacion"
                                        defaultValue={
                                            bodega.ubicacion_bodega ?? ''
                                        }
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
                                    data-test="edit-bodega-submit"
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
