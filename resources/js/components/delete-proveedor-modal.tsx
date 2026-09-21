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
import { destroy } from '@/routes/proveedores';
import type { Proveedor } from '@/types';

type Props = {
    proveedor: Proveedor | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteProveedorModal({
    proveedor,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteProveedor = () => {
        if (!proveedor) {
            return;
        }

        router.visit(destroy([proveedor.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar proveedor</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar a{' '}
                        <strong>"{proveedor?.nombre_proveedor}"</strong>?
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-proveedor-confirm"
                        disabled={processing}
                        onClick={deleteProveedor}
                    >
                        Eliminar proveedor
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
