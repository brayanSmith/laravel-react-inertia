import { Form } from '@inertiajs/react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { destroy } from '@/routes/categorias';
import type { Categoria } from '@/types';

type Props = {
    currentTeamSlug: string;
    categoria: Categoria;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteCategoriaModal({
    currentTeamSlug,
    categoria,
    open,
    onOpenChange,
}: Props) {
    const [confirmationName, setConfirmationName] = useState('');

    const canDelete = confirmationName === categoria.nombre;

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
            setConfirmationName('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <Form
                    key={String(open)}
                    {...destroy.form([currentTeamSlug, categoria.id])}
                    className="space-y-6"
                    onSuccess={() => handleOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>¿Estás seguro?</DialogTitle>
                                <DialogDescription>
                                    Esta acción no se puede deshacer. Se
                                    eliminará permanentemente la categoría{' '}
                                    <strong>"{categoria.nombre}"</strong>, junto
                                    con todas sus subcategorías y los productos
                                    asociados.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-2">
                                <Label htmlFor="confirmation-name">
                                    Escribe{' '}
                                    <strong>"{categoria.nombre}"</strong> para
                                    confirmar
                                </Label>
                                <Input
                                    id="confirmation-name"
                                    data-test="delete-categoria-name"
                                    value={confirmationName}
                                    onChange={(event) =>
                                        setConfirmationName(event.target.value)
                                    }
                                    placeholder="Nombre de la categoría"
                                    autoComplete="off"
                                />
                                <InputError message={errors.nombre} />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancelar
                                    </Button>
                                </DialogClose>

                                <Button
                                    variant="destructive"
                                    type="submit"
                                    data-test="delete-categoria-confirm"
                                    disabled={!canDelete || processing}
                                >
                                    Eliminar categoría
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
