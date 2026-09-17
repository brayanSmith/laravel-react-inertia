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
import { destroy } from '@/routes/bodegas';
import type { Bodega } from '@/types';

type Props = {
    teamSlug: string;
    bodega: Bodega | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteBodegaModal({
    teamSlug,
    bodega,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const deleteBodega = () => {
        if (!bodega) {
            return;
        }

        router.visit(destroy([teamSlug, bodega.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar bodega</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar{' '}
                        <strong>"{bodega?.nombre_bodega}"</strong>? Esta acción
                        no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-bodega-confirm"
                        disabled={processing}
                        onClick={deleteBodega}
                    >
                        Eliminar bodega
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
