import { Badge } from '@/components/ui/badge';
import { useTiposPrecio } from '@/hooks/use-tipos-precio';
import { cn } from '@/lib/utils';
import type { PosCatalogoProducto, TipoPrecioPedido } from '@/types';

type Props = {
    producto: PosCatalogoProducto;
    /** Stock still left after what the cart already reserved. */
    stockDisponible: number;
    /** Units of this product already in the cart (0 when it is not). */
    enCarrito: number;
    /** The tipo de precio being sold at; its price row is highlighted. */
    tipoPrecio: TipoPrecioPedido;
    onAdd: (producto: PosCatalogoProducto) => void;
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

function PrecioRow({
    label,
    value,
    colorClassName,
    active = false,
}: {
    label: string;
    value: string | null;
    colorClassName: string;
    active?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between rounded px-1 text-xs',
                active && 'bg-primary/10 ring-primary/40 ring-1',
            )}
        >
            <span className="text-muted-foreground">{label}</span>
            <span className={cn('font-semibold', colorClassName)}>
                {currencyFormatter.format(Number(value ?? 0))}
            </span>
        </div>
    );
}

export default function PosProductCard({
    producto,
    stockDisponible,
    enCarrito,
    tipoPrecio,
    onAdd,
}: Props) {
    const { puedeDetal, puedeMayorista } = useTiposPrecio();
    const nombre =
        producto.concatenar_codigo_nombre ??
        producto.referencia_producto ??
        `Producto ${producto.id}`;
    const hasStock = stockDisponible > 0;

    return (
        <button
            type="button"
            onClick={() => onAdd(producto)}
            data-test="pos-product-card"
            className={cn(
                'hover:border-primary flex w-full min-w-0 flex-col gap-2 rounded-lg border p-2 text-left transition',
                enCarrito > 0
                    ? 'border-primary bg-primary/10 ring-primary/40 ring-2'
                    : 'bg-card',
            )}
        >
            <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-md">
                {producto.imagen_producto_url ? (
                    <img
                        src={producto.imagen_producto_url}
                        alt={nombre}
                        loading="lazy"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-center text-[10px]">
                        Sin imagen
                    </div>
                )}

                {enCarrito > 0 ? (
                    <Badge
                        className="bg-primary text-primary-foreground absolute top-1 left-1 border-transparent"
                        data-test="pos-card-en-carrito"
                    >
                        {enCarrito} en carrito
                    </Badge>
                ) : null}

                <Badge
                    className={cn(
                        'absolute top-1 right-1 border-transparent',
                        hasStock
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-100 text-red-700 hover:bg-red-100',
                    )}
                >
                    {stockDisponible}
                </Badge>
            </div>

            <p className="line-clamp-2 text-xs font-medium" title={nombre}>
                {nombre}
            </p>

            <div className="space-y-0.5">
                {puedeDetal ? (
                    <PrecioRow
                        label="Detal"
                        active={tipoPrecio === 'DETAL'}
                        value={producto.valor_detal}
                        colorClassName="text-emerald-600 dark:text-emerald-400"
                    />
                ) : null}
                {puedeMayorista ? (
                    <PrecioRow
                        label="Mayorista"
                        active={tipoPrecio === 'MAYORISTA'}
                        value={producto.valor_mayorista}
                        colorClassName="text-amber-600 dark:text-amber-400"
                    />
                ) : null}
                <PrecioRow
                    label="S. Instalación"
                    value={producto.valor_sin_instalacion}
                    colorClassName="text-red-600 dark:text-red-400"
                />
            </div>
        </button>
    );
}
