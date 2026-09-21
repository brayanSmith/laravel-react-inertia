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
import type { Pedido, PedidoRoutes } from '@/types';

type Props = {
    pedido: Pedido | null;
    routes: PedidoRoutes;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeletePedidoModal({
    pedido,
    routes,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deletePedido = () => {
        if (!pedido) {
            return;
        }

        router.visit(routes.pedidos.destroy([pedido.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar pedido</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar el pedido de{' '}
                        <strong>
                            "{pedido?.cliente?.razon_social ?? pedido?.id}"
                        </strong>
                        ? Se revertirá el stock descontado y esta acción no se
                        puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-pedido-confirm"
                        disabled={processing}
                        onClick={deletePedido}
                    >
                        Eliminar pedido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
