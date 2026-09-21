import { router } from '@inertiajs/react';
import { RotateCcw } from 'lucide-react';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type Props = {
    /** The Wayfinder route definition of the module's `restore` action. */
    action: { url: string; method: string };
    /** What is being restored, as the confirmation words it ("el cliente Juan"). */
    nombre: string;
    /** Extra consequence worth telling before confirming (e.g. the stock effect). */
    aviso?: string;
    dataTest?: string;
};

/** Restores a deleted record, after asking for confirmation. */
export default function RestoreButton({
    action,
    nombre,
    aviso,
    dataTest = 'restore-button',
}: Props) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const restaurar = () => {
        router.visit(action.url, {
            method: 'patch',
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            data-test={dataTest}
                            onClick={() => setOpen(true)}
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Restaurar</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restaurar registro</DialogTitle>
                        <DialogDescription>
                            ¿Restaurar {nombre}? Volverá a aparecer en el
                            listado de activos.
                            {aviso ? ` ${aviso}` : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button
                            disabled={processing}
                            onClick={restaurar}
                            data-test={`${dataTest}-confirm`}
                        >
                            Restaurar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
