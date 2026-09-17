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
import { destroy } from '@/routes/pucs';
import type { Puc } from '@/types';

type Props = {
    teamSlug: string;
    puc: Puc | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeletePucModal({
    teamSlug,
    puc,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deletePuc = () => {
        if (!puc) {
            return;
        }

        router.visit(destroy([teamSlug, puc.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar cuenta PUC</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar{' '}
                        <strong>
                            "{puc?.concatenar_subcuenta_concepto}"
                        </strong>
                        ? Solo se puede eliminar si no tiene abonos
                        asociados.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-puc-confirm"
                        disabled={processing}
                        onClick={deletePuc}
                    >
                        Eliminar cuenta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
