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
import { destroy } from '@/routes/gastos';
import type { Gasto } from '@/types';

type Props = {
    teamSlug: string;
    gasto: Gasto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteGastoModal({
    teamSlug,
    gasto,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteGasto = () => {
        if (!gasto) {
            return;
        }

        router.visit(destroy([teamSlug, gasto.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar gasto</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar el gasto{' '}
                        <strong>"{gasto?.descripcion}"</strong>? Esta acción no
                        se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-gasto-confirm"
                        disabled={processing}
                        onClick={deleteGasto}
                    >
                        Eliminar gasto
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
