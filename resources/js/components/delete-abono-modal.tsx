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
import type { Pedido, PedidoAbono, PedidoRoutes } from '@/types';

type Props = {
    teamSlug: string;
    pedido: Pedido;
    routes: PedidoRoutes;
    abono: PedidoAbono | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteAbonoModal({
    teamSlug,
    pedido,
    routes,
    abono,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteAbono = () => {
        if (!abono) {
            return;
        }

        router.visit(routes.abonos.destroy([teamSlug, pedido.id, abono.id]), {
            method: 'delete',
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar pago</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar este abono? El saldo
                        pendiente del pedido se recalculará y esta acción no
                        se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-abono-confirm"
                        disabled={processing}
                        onClick={deleteAbono}
                    >
                        Eliminar pago
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
