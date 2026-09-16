import { router } from '@inertiajs/react';
import { useState } from 'react';
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
import { destroy } from '@/routes/categorias/subcategorias';
import type { Categoria, SubCategoria } from '@/types';

type Props = {
    currentTeamSlug: string;
    categoria: Categoria;
    subCategoria: SubCategoria | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteSubcategoriaModal({
    currentTeamSlug,
    categoria,
    subCategoria,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteSubCategoria = () => {
        if (!subCategoria) {
            return;
        }

        router.visit(
            destroy([currentTeamSlug, categoria.id, subCategoria.id]),
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Estás seguro?</DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer. Se eliminará
                        permanentemente la subcategoría{' '}
                        <strong>{subCategoria?.nombre}</strong> y los productos
                        asociados a ella.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-subcategoria-confirm"
                        disabled={processing}
                        onClick={deleteSubCategoria}
                    >
                        Eliminar subcategoría
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
