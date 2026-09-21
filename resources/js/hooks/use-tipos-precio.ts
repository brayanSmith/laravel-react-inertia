import { usePage } from '@inertiajs/react';
import { TIPOS_PRECIO } from '@/lib/tipos-precio';
import type { TipoPrecioPermitido } from '@/lib/tipos-precio';
import type { TipoPrecioPedido } from '@/types';

/**
 * The product prices the authenticated user may see and use (set per user in
 * "Usuarios"): valor_detal, valor_mayorista and costo.
 */
export function useTiposPrecio() {
    const { tiposPrecioPermitidos } = usePage().props;

    const puede = (tipo: TipoPrecioPermitido): boolean =>
        tiposPrecioPermitidos.includes(tipo);

    /** The tipo_precio values of a pedido the user may pick. */
    const tiposPedido: TipoPrecioPedido[] = TIPOS_PRECIO.filter((tipo) =>
        puede(tipo.value),
    ).map((tipo) => tipo.pedido);

    return {
        puede,
        puedeDetal: puede('valor_detal'),
        puedeMayorista: puede('valor_mayorista'),
        puedeCosto: puede('costo'),
        tiposPedido,
    };
}
