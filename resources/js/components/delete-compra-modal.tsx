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
import { destroy } from '@/routes/compras';
import type { Compra } from '@/types';

type Props = {
    compra: Compra | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteCompraModal({
    compra,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteCompra = () => {
        if (!compra) {
            return;
        }

        router.visit(destroy([compra.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar compra</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar la compra{' '}
                        <strong>"{compra?.factura}"</strong>? Se revertirá el
                        stock recibido asociado y esta acción no se puede
                        deshacer.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-compra-confirm"
                        disabled={processing}
                        onClick={deleteCompra}
                    >
                        Eliminar compra
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
