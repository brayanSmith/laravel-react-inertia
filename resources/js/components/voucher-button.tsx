import { useHttp } from '@inertiajs/react';
import { FileDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { descargarVoucher } from '@/components/pos/voucher-actions';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PosVoucher } from '@/types';

type Props = {
    /** The Wayfinder route definition that returns the pedido's voucher data. */
    action: { url: string; method: string };
    /** Show a text label next to the icon (the modal) or the icon alone (tables). */
    label?: string;
    dataTest?: string;
};

/**
 * Downloads a pedido's payment voucher as a PDF: fetches its data and
 * renders the PDF in the browser (the renderer loads only on first use).
 */
export default function VoucherButton({
    action,
    label,
    dataTest = 'voucher-button',
}: Props) {
    const { submit } = useHttp();
    const [descargando, setDescargando] = useState(false);

    const descargar = async () => {
        setDescargando(true);

        try {
            const voucher = (await submit('get', action.url)) as PosVoucher;

            await descargarVoucher(voucher);
        } catch {
            toast.error('No se pudo descargar el voucher.');
        } finally {
            setDescargando(false);
        }
    };

    const button = (
        <Button
            type="button"
            variant={label ? 'outline' : 'ghost'}
            size="sm"
            disabled={descargando}
            onClick={descargar}
            data-test={dataTest}
        >
            <FileDown className="h-4 w-4" />
            {label ? (descargando ? 'Generando...' : label) : null}
        </Button>
    );

    if (label) {
        return button;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>
                <p>{descargando ? 'Generando...' : 'Descargar voucher'}</p>
            </TooltipContent>
        </Tooltip>
    );
}
