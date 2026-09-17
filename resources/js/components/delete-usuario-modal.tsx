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
import { destroy } from '@/routes/usuarios';
import type { Usuario } from '@/types';

type Props = {
    teamSlug: string;
    usuario: Usuario | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteUsuarioModal({
    teamSlug,
    usuario,
    open,
    onOpenChange,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const removeUsuario = () => {
        if (!usuario) {
            return;
        }

        router.visit(destroy([teamSlug, usuario.id]), {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar usuario</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de quitar a{' '}
                        <strong>"{usuario?.name}"</strong> de este equipo? Su
                        cuenta no se elimina, solo pierde acceso a este equipo.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="delete-usuario-confirm"
                        disabled={processing}
                        onClick={removeUsuario}
                    >
                        Eliminar usuario
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
