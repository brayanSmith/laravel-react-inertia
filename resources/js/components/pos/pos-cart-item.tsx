import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PosCartLine } from '@/hooks/use-pos-cart';

type Props = {
    line: PosCartLine;
    onCantidadChange: (cantidad: number) => void;
    onPrecioChange: (precio: number) => void;
    onEdit: () => void;
    onRemove: () => void;
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

export default function PosCartItem({
    line,
    onCantidadChange,
    onPrecioChange,
    onEdit,
    onRemove,
}: Props) {
    return (
        <div
            className="flex items-start gap-2 border-b py-2 last:border-b-0"
            data-test="pos-cart-item"
        >
            <button
                type="button"
                onClick={onEdit}
                title="Editar cantidad, valor o bodega"
                data-test="pos-cart-item-edit"
                className="hover:bg-accent min-w-0 flex-1 rounded p-1 text-left"
            >
                <p
                    className="text-sm font-medium break-words"
                    title={line.nombre}
                >
                    {line.nombre}
                </p>
                <p className="text-muted-foreground text-xs">
                    {line.bodegaNombre} ·
                    {currencyFormatter.format(
                        line.cantidad * line.precioUnitario,
                    )}
                </p>
            </button>

            <Input
                type="number"
                min={1}
                value={line.cantidad}
                onChange={(event) =>
                    onCantidadChange(Number(event.target.value) || 0)
                }
                className="h-8 w-16 text-right"
                data-test="pos-cart-item-cantidad"
            />

            <Input
                type="number"
                min={0}
                value={line.precioUnitario}
                onChange={(event) =>
                    onPrecioChange(Number(event.target.value) || 0)
                }
                className="h-8 w-24 text-right"
                data-test="pos-cart-item-precio"
            />

            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                data-test="pos-cart-item-remove"
            >
                <X className="size-4" />
            </Button>
        </div>
    );
}
