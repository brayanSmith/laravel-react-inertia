import { CheckCircle2, Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useHotkeys } from '@/hooks/use-hotkeys';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { PosVoucher } from '@/types';

type Props = {
    voucher: PosVoucher;
    onClose: () => void;
};

/**
 * Shown after a sale is registered: the turno to call the customer with and
 * a button that renders the payment voucher as a PDF (in the browser, with
 * @react-pdf/renderer) and opens it in a new tab, ready to print.
 */
export default function PosExitoModal({ voucher, onClose }: Props) {
    const [generando, setGenerando] = useState(false);

    const imprimir = async () => {
        // Opened synchronously so the browser doesn't block it as a popup;
        // pointed at the PDF once it's rendered.
        const ventana = window.open('', '_blank');
        setGenerando(true);

        try {
            const { generarVoucherPdf } =
                await import('@/components/pos/voucher-pdf');
            const url = URL.createObjectURL(await generarVoucherPdf(voucher));

            if (ventana) {
                ventana.location.href = url;
            } else {
                window.open(url, '_blank');
            }
        } catch {
            ventana?.close();
            toast.error('No se pudo generar el voucher.');
        } finally {
            setGenerando(false);
        }
    };

    useHotkeys([
        {
            key: 'F9',
            handler: () => {
                if (!generando) {
                    void imprimir();
                }
            },
        },
    ]);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md" data-test="pos-exito-modal">
                <DialogHeader className="items-center text-center">
                    <CheckCircle2 className="size-12 text-emerald-600" />
                    <DialogTitle className="text-xl">
                        Registro de pedido exitoso
                    </DialogTitle>
                    <DialogDescription>
                        Remisión N° {voucher.pedido.id}
                    </DialogDescription>
                </DialogHeader>

                {voucher.pedido.turno ? (
                    <div className="text-center">
                        <p className="text-muted-foreground text-xs tracking-widest">
                            TURNO
                        </p>
                        <p
                            className="text-4xl font-bold tracking-wider"
                            data-test="pos-exito-turno"
                        >
                            {voucher.pedido.turno}
                        </p>
                    </div>
                ) : null}

                <DialogFooter className="gap-2 sm:justify-center">
                    <Button
                        type="button"
                        onClick={imprimir}
                        disabled={generando}
                        data-test="pos-imprimir-voucher"
                    >
                        <Printer />
                        {generando ? 'Generando...' : 'Imprimir voucher'}
                        <kbd className="text-xs opacity-70">F9</kbd>
                    </Button>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Nueva venta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
