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
import { update } from '@/routes/marcas';
import type { Marca } from '@/types';

type Props = {
    marca: Marca | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditMarcaModal({ marca, open, onOpenChange }: Props) {
    if (!marca) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Form
                    key={String(open)}
                    {...update.form([marca.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar marca</DialogTitle>
                                <DialogDescription>
                                    Actualiza los datos de la marca.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_marca">Nombre</Label>
                                    <Input
                                        id="edit_marca"
                                        name="marca"
                                        data-test="edit-marca-nombre"
                                        defaultValue={marca.marca}
                                        required
                                    />
                                    <InputError message={errors.marca} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_descripcion_marca">
                                        Descripción
                                    </Label>
                                    <Input
                                        id="edit_descripcion_marca"
                                        name="descripcion_marca"
                                        data-test="edit-marca-descripcion"
                                        defaultValue={
                                            marca.descripcion_marca ?? ''
                                        }
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
                                    data-test="edit-marca-submit"
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
