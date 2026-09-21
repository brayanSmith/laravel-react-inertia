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
import { destroy } from '@/routes/stock-iniciales';
import type { StockInicial } from '@/types';

type Props = {
    stockInicial: StockInicial | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteStockInicialModal({
    stockInicial,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteStockInicial = () => {
        if (!stockInicial) {
            return;
        }

        router.visit(destroy([stockInicial.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    const productoLabel = stockInicial
        ? (stockInicial.producto?.concatenar_codigo_nombre ??
          stockInicial.producto?.referencia_producto ??
          `Producto ${stockInicial.producto_id}`)
        : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar stock inicial</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar el stock inicial de{' '}
                        <strong>"{productoLabel}"</strong>? Esta acción no se
                        puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-stock-inicial-confirm"
                        disabled={processing}
                        onClick={deleteStockInicial}
                    >
                        Eliminar stock inicial
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
