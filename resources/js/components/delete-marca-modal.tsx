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
import { destroy } from '@/routes/marcas';
import type { Marca } from '@/types';

type Props = {
    marca: Marca | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteMarcaModal({ marca, open, onOpenChange }: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteMarca = () => {
        if (!marca) {
            return;
        }

        router.visit(destroy([marca.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar marca</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar{' '}
                        <strong>"{marca?.marca}"</strong>? Solo se puede
                        eliminar si no tiene productos asociados.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-marca-confirm"
                        disabled={processing}
                        onClick={deleteMarca}
                    >
                        Eliminar marca
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
