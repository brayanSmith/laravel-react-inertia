import type { TipoPrecioPedido } from '@/types';

type ProductoConPrecios = {
    valor_detal?: string | null;
    valor_mayorista?: string | null;
    costo_producto?: string | null;
};

/**
 * The unit price a product should default to for a given tipo_precio.
 * Shared by the line-by-line pedido form and the POS catalog so both stay
 * in sync with a single pricing rule.
 */
export function precioParaTipo(
    producto: ProductoConPrecios,
    tipoPrecio: TipoPrecioPedido,
): number {
    if (tipoPrecio === 'MAYORISTA') {
        return Number(producto.valor_mayorista ?? producto.valor_detal ?? 0);
    }

    if (tipoPrecio === 'OTRO') {
        return Number(producto.costo_producto ?? 0);
    }

    return Number(producto.valor_detal ?? 0);
}
