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
import { destroy } from '@/routes/productos';
import type { Producto } from '@/types';

type Props = {
    teamSlug: string;
    producto: Producto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteProductoModal({
    teamSlug,
    producto,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteProducto = () => {
        if (!producto) {
            return;
        }

        router.visit(destroy([teamSlug, producto.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar producto</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar{' '}
                        <strong>"{producto?.concatenar_codigo_nombre}"</strong>?
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-producto-confirm"
                        disabled={processing}
                        onClick={deleteProducto}
                    >
                        Eliminar producto
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
