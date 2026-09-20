import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { precioParaTipo } from '@/lib/pedido-pricing';
import { cn } from '@/lib/utils';
import type {
    BodegaOption,
    PosCatalogoProducto,
    TipoPrecioPedido,
} from '@/types';

export type PosAddSelection = {
    bodegaId: number;
    bodegaNombre: string;
    cantidad: number;
    precioUnitario: number;
};

type Props = {
    producto: PosCatalogoProducto;
    bodegas: BodegaOption[];
    defaultBodegaId: string;
    tipoPrecio: TipoPrecioPedido;
    /** The cart line for this product in a bodega, if it is already there. */
    lineFor: (
        productoId: number,
        bodegaId: number,
    ) => { cantidad: number; precioUnitario: number } | undefined;
    onConfirm: (selection: PosAddSelection) => void;
    onClose: () => void;
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

function initialBodegaId(
    producto: PosCatalogoProducto,
    bodegas: BodegaOption[],
    defaultBodegaId: string,
): string {
    if (defaultBodegaId) {
        return defaultBodegaId;
    }

    const conStock = bodegas.find(
        (bodega) => (producto.stock_por_bodega[bodega.id] ?? 0) > 0,
    );

    return String((conStock ?? bodegas[0])?.id ?? '');
}

/**
 * Asks for the quantity (with − / + buttons), the unit price (editable, for
 * custom prices) and the bodega to sell from before a catalog product goes
 * into the cart. Mount it with a `key` per product so the fields reset.
 */
export default function PosAddProductModal({
    producto,
    bodegas,
    defaultBodegaId,
    tipoPrecio,
    lineFor,
    onConfirm,
    onClose,
}: Props) {
    const [bodegaId, setBodegaId] = useState(() =>
        initialBodegaId(producto, bodegas, defaultBodegaId),
    );
    const precioDefault = String(precioParaTipo(producto, tipoPrecio));
    // Reopening a product that is already in the cart shows what was saved.
    const existente = lineFor(producto.id, Number(bodegaId));
    const [cantidad, setCantidad] = useState(existente?.cantidad ?? 1);
    const [precio, setPrecio] = useState(
        existente ? String(existente.precioUnitario) : precioDefault,
    );

    const handleBodegaChange = (value: string) => {
        setBodegaId(value);

        const guardada = lineFor(producto.id, Number(value));

        setCantidad(guardada?.cantidad ?? 1);
        setPrecio(guardada ? String(guardada.precioUnitario) : precioDefault);
    };

    const nombre =
        producto.concatenar_codigo_nombre ??
        producto.referencia_producto ??
        `Producto ${producto.id}`;

    const disponibleEn = (id: number): number =>
        producto.stock_por_bodega[id] ?? 0;

    const bodega = bodegas.find((item) => String(item.id) === bodegaId);
    const disponible = bodega ? disponibleEn(bodega.id) : 0;
    const precioNum = Number(precio) || 0;
    const sobrepasaStock = cantidad > disponible;

    const handleConfirm = () => {
        if (!bodega || cantidad <= 0) {
            return;
        }

        onConfirm({
            bodegaId: bodega.id,
            bodegaNombre: bodega.nombre_bodega,
            cantidad,
            precioUnitario: precioNum,
        });
    };

    // Keyboard: + / − change the quantity, Enter adds to the cart. The
    // "valor unitario" field keeps its own typing (only Enter is taken).
    const handleKeyDown = (event: React.KeyboardEvent) => {
        const target = event.target as HTMLElement;
        const enPrecio = target.id === 'pos-add-precio';

        if (event.key === 'Enter' && target.tagName !== 'BUTTON') {
            event.preventDefault();
            handleConfirm();

            return;
        }

        if (enPrecio) {
            return;
        }

        if (event.key === '+') {
            event.preventDefault();
            setCantidad((prev) => prev + 1);
        } else if (event.key === '-') {
            event.preventDefault();
            setCantidad((prev) => Math.max(prev - 1, 1));
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="sm:max-w-md"
                data-test="pos-add-modal"
                onKeyDown={handleKeyDown}
            >
                <DialogHeader>
                    <DialogTitle className="pr-6 text-base">
                        {nombre}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Bodega</Label>
                        <Select
                            value={bodegaId}
                            onValueChange={handleBodegaChange}
                        >
                            <SelectTrigger
                                className="w-full"
                                data-test="pos-add-bodega"
                            >
                                <SelectValue placeholder="Seleccione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {bodegas.map((item) => (
                                    <SelectItem
                                        key={item.id}
                                        value={String(item.id)}
                                    >
                                        {item.nombre_bodega} ·{' '}
                                        {disponibleEn(item.id)} disp.
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p
                            className={cn(
                                'text-xs',
                                sobrepasaStock
                                    ? 'text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            Disponible en esta bodega: {disponible}
                            {sobrepasaStock
                                ? ' — la cantidad supera el stock'
                                : ''}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label>Cantidad</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                    setCantidad((prev) => Math.max(prev - 1, 1))
                                }
                                disabled={cantidad <= 1}
                                data-test="pos-add-minus"
                            >
                                <Minus className="size-4" />
                            </Button>
                            <Input
                                type="number"
                                min={1}
                                value={cantidad}
                                onChange={(event) =>
                                    setCantidad(
                                        Math.max(
                                            Number(event.target.value) || 1,
                                            1,
                                        ),
                                    )
                                }
                                className="text-center"
                                autoFocus
                                onFocus={(event) => event.target.select()}
                                data-test="pos-add-cantidad"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setCantidad((prev) => prev + 1)}
                                data-test="pos-add-plus"
                            >
                                <Plus className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="pos-add-precio">Valor unitario</Label>
                        <Input
                            id="pos-add-precio"
                            type="number"
                            min={0}
                            value={precio}
                            onChange={(event) => setPrecio(event.target.value)}
                            data-test="pos-add-precio"
                        />
                    </div>

                    <div className="flex justify-between border-t pt-3 font-semibold">
                        <span>Subtotal</span>
                        <span>
                            {currencyFormatter.format(cantidad * precioNum)}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!bodega}
                        data-test="pos-add-confirm"
                    >
                        {existente ? 'Guardar cambios' : 'Agregar al carrito'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
