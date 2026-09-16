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
import { store, update } from '@/routes/categorias/subcategorias';
import type { Categoria, SubCategoria } from '@/types';

type Props = {
    currentTeamSlug: string;
    categoria: Categoria;
    subCategoria: SubCategoria | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function SubcategoriaModal({
    currentTeamSlug,
    categoria,
    subCategoria,
    open,
    onOpenChange,
}: Props) {
    const isEditing = subCategoria !== null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Form
                    key={subCategoria?.id ?? 'new'}
                    {...(isEditing
                        ? update.form([
                              currentTeamSlug,
                              categoria.id,
                              subCategoria.id,
                          ])
                        : store.form([currentTeamSlug, categoria.id]))}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {isEditing
                                        ? 'Editar subcategoría'
                                        : 'Nueva subcategoría'}
                                </DialogTitle>
                                <DialogDescription>
                                    {isEditing
                                        ? `Actualiza la subcategoría de ${categoria.nombre}.`
                                        : `Agrega una nueva subcategoría a ${categoria.nombre}.`}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="subcategoria-nombre">
                                    Nombre
                                </Label>
                                <Input
                                    id="subcategoria-nombre"
                                    name="nombre"
                                    data-test="subcategoria-nombre"
                                    defaultValue={subCategoria?.nombre}
                                    placeholder="Destornilladores"
                                    required
                                />
                                <InputError message={errors.nombre} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="subcategoria-descripcion">
                                    Descripción
                                </Label>
                                <Textarea
                                    id="subcategoria-descripcion"
                                    name="descripcion"
                                    data-test="subcategoria-descripcion"
                                    defaultValue={
                                        subCategoria?.descripcion ?? ''
                                    }
                                    placeholder="Descripción de la subcategoría"
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
                                    data-test="subcategoria-submit"
                                    disabled={processing}
                                >
                                    {isEditing
                                        ? 'Guardar cambios'
                                        : 'Crear subcategoría'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
