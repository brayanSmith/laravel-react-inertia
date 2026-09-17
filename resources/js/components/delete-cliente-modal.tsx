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
import { destroy } from '@/routes/clientes';
import type { Cliente } from '@/types';

type Props = {
    teamSlug: string;
    cliente: Cliente | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteClienteModal({
    teamSlug,
    cliente,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteCliente = () => {
        if (!cliente) {
            return;
        }

        router.visit(destroy([teamSlug, cliente.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar cliente</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar a{' '}
                        <strong>"{cliente?.razon_social}"</strong>? Esta
                        acción se puede revertir solo desde la base de datos.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-cliente-confirm"
                        disabled={processing}
                        onClick={deleteCliente}
                    >
                        Eliminar cliente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
