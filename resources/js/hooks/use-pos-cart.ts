import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';

export type PosCartLine = {
    /** Unique per producto + bodega: the same product can be sold from several bodegas. */
    key: string;
    productoId: number;
    bodegaId: number;
    nombre: string;
    bodegaNombre: string;
    cantidad: number;
    precioUnitario: number;
};

export type PosCartNewLine = Omit<PosCartLine, 'key'>;

export const cartLineKey = (productoId: number, bodegaId: number): string =>
    `${productoId}:${bodegaId}`;

/**
 * Cart-line state for the POS screen: add (merging the same product from the
 * same bodega), change quantity or price, remove, clear, the running
 * pre-adjustments total, and how much of each product is already reserved by
 * the cart (so the catalog can show the stock that is still left). Pure state
 * management over the lines of the active venta (owned by
 * `usePosVentas`) — pricing rules live in the caller via `@/lib/pedido-pricing`.
 */
export function usePosCart(
    lines: PosCartLine[],
    setLines: Dispatch<SetStateAction<PosCartLine[]>>,
) {
    const addLine = (line: PosCartNewLine) => {
        const key = cartLineKey(line.productoId, line.bodegaId);

        setLines((prev) => {
            const existing = prev.find((item) => item.key === key);

            if (existing) {
                return prev.map((item) =>
                    item.key === key
                        ? {
                              ...item,
                              cantidad: item.cantidad + line.cantidad,
                              precioUnitario: line.precioUnitario,
                          }
                        : item,
                );
            }

            return [...prev, { ...line, key }];
        });
    };

    /** Adds the line, or replaces the quantity and price of an existing one. */
    const upsertLine = (line: PosCartNewLine) => {
        const key = cartLineKey(line.productoId, line.bodegaId);

        setLines((prev) =>
            prev.some((item) => item.key === key)
                ? prev.map((item) =>
                      item.key === key ? { ...item, ...line } : item,
                  )
                : [...prev, { ...line, key }],
        );
    };

    /** Re-prices every line (e.g. when the tipo de precio changes). */
    const reprice = (precioDe: (productoId: number) => number | undefined) => {
        setLines((prev) =>
            prev.map((line) => ({
                ...line,
                precioUnitario:
                    precioDe(line.productoId) ?? line.precioUnitario,
            })),
        );
    };

    const setCantidad = (key: string, cantidad: number) => {
        setLines((prev) =>
            cantidad > 0
                ? prev.map((line) =>
                      line.key === key ? { ...line, cantidad } : line,
                  )
                : prev.filter((line) => line.key !== key),
        );
    };

    const setPrecioUnitario = (key: string, precioUnitario: number) => {
        setLines((prev) =>
            prev.map((line) =>
                line.key === key ? { ...line, precioUnitario } : line,
            ),
        );
    };

    const removeLine = (key: string) => {
        setLines((prev) => prev.filter((line) => line.key !== key));
    };

    const clear = () => setLines([]);

    const totalBruto = useMemo(
        () =>
            lines.reduce(
                (sum, line) => sum + line.cantidad * line.precioUnitario,
                0,
            ),
        [lines],
    );

    const reserved = useMemo(() => {
        const porProducto = new Map<number, number>();

        lines.forEach((line) => {
            porProducto.set(
                line.productoId,
                (porProducto.get(line.productoId) ?? 0) + line.cantidad,
            );
        });

        return { porProducto };
    }, [lines]);

    const lineFor = (productoId: number, bodegaId: number) =>
        lines.find((line) => line.key === cartLineKey(productoId, bodegaId));

    return {
        lines,
        addLine,
        upsertLine,
        reprice,
        setCantidad,
        setPrecioUnitario,
        removeLine,
        clear,
        totalBruto,
        reservedByProducto: reserved.porProducto,
        lineFor,
    };
}
