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
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/categorias';
import type { Categoria } from '@/types';

type Props = {
    currentTeamSlug: string;
    categoria: Categoria | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditCategoriaModal({
    currentTeamSlug,
    categoria,
    open,
    onOpenChange,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {categoria ? (
                    <Form
                        key={categoria.id}
                        {...update.form([currentTeamSlug, categoria.id])}
                        className="space-y-6"
                        onSuccess={() => onOpenChange(false)}
                    >
                        {({ errors, processing }) => (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Editar categoría</DialogTitle>
                                    <DialogDescription>
                                        Actualiza la información de{' '}
                                        {categoria.nombre}.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-categoria-nombre">
                                        Nombre
                                    </Label>
                                    <Input
                                        id="edit-categoria-nombre"
                                        name="nombre"
                                        data-test="edit-categoria-nombre"
                                        defaultValue={categoria.nombre}
                                        required
                                    />
                                    <InputError message={errors.nombre} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-categoria-descripcion">
                                        Descripción
                                    </Label>
                                    <Textarea
                                        id="edit-categoria-descripcion"
                                        name="descripcion"
                                        data-test="edit-categoria-descripcion"
                                        defaultValue={
                                            categoria.descripcion ?? ''
                                        }
                                    />
                                    <InputError message={errors.descripcion} />
                                </div>

                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button variant="secondary">
                                            Cancelar
                                        </Button>
                                    </DialogClose>

                                    <Button
                                        type="submit"
                                        data-test="edit-categoria-submit"
                                        disabled={processing}
                                    >
                                        Guardar cambios
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
