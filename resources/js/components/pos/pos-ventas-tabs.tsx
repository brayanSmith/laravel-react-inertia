import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PosVenta } from '@/hooks/use-pos-ventas';

type Props = {
    ventas: PosVenta[];
    activaId: number;
    onSelect: (id: number) => void;
    onNew: () => void;
    onClose: (id: number) => void;
};

/** One tab per simultaneous sale, with the number of lines it holds. */
export default function PosVentasTabs({
    ventas,
    activaId,
    onSelect,
    onNew,
    onClose,
}: Props) {
    const handleClose = (venta: PosVenta) => {
        if (
            venta.lines.length > 0 &&
            !window.confirm(`¿Descartar "${venta.nombre}" y su carrito?`)
        ) {
            return;
        }

        onClose(venta.id);
    };

    return (
        <div
            className="flex items-center gap-1 overflow-x-auto pb-1"
            role="tablist"
            data-test="pos-ventas-tabs"
        >
            {ventas.map((venta) => {
                const active = venta.id === activaId;

                return (
                    <div
                        key={venta.id}
                        role="tab"
                        aria-selected={active}
                        className={cn(
                            'flex shrink-0 items-center rounded-md border text-sm',
                            active
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'hover:bg-accent',
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => onSelect(venta.id)}
                            className="flex items-center gap-1.5 py-1.5 pr-1 pl-3"
                            data-test="pos-venta-tab"
                        >
                            {venta.nombre}
                            {venta.lines.length > 0 ? (
                                <span
                                    className={cn(
                                        'rounded-full px-1.5 text-xs',
                                        active
                                            ? 'bg-primary-foreground/20'
                                            : 'bg-muted',
                                    )}
                                >
                                    {venta.lines.length}
                                </span>
                            ) : null}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleClose(venta)}
                            title="Cerrar venta"
                            className="rounded-r-md p-1.5 opacity-70 hover:opacity-100"
                            data-test="pos-venta-close"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                );
            })}

            <button
                type="button"
                onClick={onNew}
                title="Nueva venta"
                className="hover:bg-accent shrink-0 rounded-md border p-1.5"
                data-test="pos-venta-new"
            >
                <Plus className="size-4" />
            </button>
        </div>
    );
}
