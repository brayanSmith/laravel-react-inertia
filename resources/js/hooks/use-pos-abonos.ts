import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';

export type PosAbono = {
    id: number;
    pucId: number;
    pucNombre: string;
    monto: number;
    conCuantoPago: number;
    descripcion: string;
};

export type PosNewAbono = Omit<PosAbono, 'id'>;

/** Payments (abonos) collected at checkout, before the pedido exists. */
export function usePosAbonos(
    abonos: PosAbono[],
    setAbonos: Dispatch<SetStateAction<PosAbono[]>>,
) {
    const addAbono = (abono: PosNewAbono) => {
        setAbonos((prev) => [
            ...prev,
            {
                ...abono,
                id: prev.reduce((max, item) => Math.max(max, item.id), 0) + 1,
            },
        ]);
    };

    const removeAbono = (id: number) => {
        setAbonos((prev) => prev.filter((abono) => abono.id !== id));
    };

    const clear = () => setAbonos([]);

    const totalAbonado = useMemo(
        () => abonos.reduce((sum, abono) => sum + abono.monto, 0),
        [abonos],
    );

    /** The pedido's observación de pago: each abono's description, as a list. */
    const observacionPago = useMemo(
        () =>
            abonos
                .filter((abono) => abono.descripcion !== '')
                .map((abono) => `- ${abono.descripcion}`)
                .join('\n'),
        [abonos],
    );

    return {
        abonos,
        addAbono,
        removeAbono,
        clear,
        totalAbonado,
        observacionPago,
    };
}
