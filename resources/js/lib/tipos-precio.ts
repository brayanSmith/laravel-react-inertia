import type { TipoPrecioPedido } from '@/types';

export type TipoPrecioPermitido = 'valor_detal' | 'valor_mayorista' | 'costo';

/** The product prices a user can be allowed, and the tipo_precio of a pedido that uses each one. */
export const TIPOS_PRECIO: {
    value: TipoPrecioPermitido;
    label: string;
    pedido: TipoPrecioPedido;
}[] = [
    { value: 'valor_detal', label: 'Precio detal', pedido: 'DETAL' },
    {
        value: 'valor_mayorista',
        label: 'Precio mayorista',
        pedido: 'MAYORISTA',
    },
    { value: 'costo', label: 'Costo', pedido: 'OTRO' },
];
