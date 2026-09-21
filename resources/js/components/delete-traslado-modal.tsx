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
import { destroy } from '@/routes/traslados';
import type { Traslado } from '@/types';

type Props = {
    traslado: Traslado | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteTrasladoModal({
    traslado,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteTraslado = () => {
        if (!traslado) {
            return;
        }

        router.visit(destroy([traslado.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    const productoLabel = traslado
        ? (traslado.producto?.concatenar_codigo_nombre ??
          traslado.producto?.referencia_producto ??
          `Producto ${traslado.producto_id}`)
        : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar traslado</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar el traslado de{' '}
                        <strong>"{productoLabel}"</strong>? El stock se
                        revertirá en ambas bodegas. Esta acción no se puede
                        deshacer.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-traslado-confirm"
                        disabled={processing}
                        onClick={deleteTraslado}
                    >
                        Eliminar traslado
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
