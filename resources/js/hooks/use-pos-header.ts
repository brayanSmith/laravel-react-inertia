import type { Dispatch, SetStateAction } from 'react';
import type { TipoPagoPedido, TipoPrecioPedido } from '@/types';

export type PosHeaderState = {
    clienteId: string;
    bodegaId: string;
    vendedorId: string;
    tipoPrecio: TipoPrecioPedido;
    descuento: string;
    flete: string;
    reteica: string;
    retefuente: string;
    tipoPago: TipoPagoPedido;
    observacion: string;
    placa: string;
    aplicaTurno: boolean;
    facturacionElectronica: boolean;
};

/**
 * The pedido-level fields the POS right panel edits (cliente, bodega,
 * vendedor, tipo de precio, descuento, flete, observación, placa, turno,
 * facturación electrónica), as one state
 * object with a single patch function — keeps the panel's prop list to
 * `header` + `setField` instead of a pair of props per field.
 */
export const defaultPosHeader = (
    tipoPrecio: TipoPrecioPedido = 'DETAL',
): PosHeaderState => ({
    clienteId: '',
    bodegaId: '',
    vendedorId: '',
    tipoPrecio,
    descuento: '0',
    flete: '0',
    reteica: '0',
    retefuente: '0',
    tipoPago: 'CONTADO',
    observacion: '',
    placa: '',
    aplicaTurno: false,
    facturacionElectronica: false,
});

export function usePosHeader(
    header: PosHeaderState,
    setHeader: Dispatch<SetStateAction<PosHeaderState>>,
) {
    const setField = <K extends keyof PosHeaderState>(
        key: K,
        value: PosHeaderState[K],
    ) => {
        setHeader((prev) => ({ ...prev, [key]: value }));
    };

    /**
     * Empties the pedido (cliente, payment data, extras) for the next sale,
     * keeping what identifies the terminal: bodega, vendedor and tipo de
     * precio.
     */
    const resetVenta = () => {
        setHeader((prev) => ({
            ...defaultPosHeader(prev.tipoPrecio),
            bodegaId: prev.bodegaId,
            vendedorId: prev.vendedorId,
        }));
    };

    return { header, setField, resetVenta };
}
