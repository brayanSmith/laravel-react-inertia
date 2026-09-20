import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import type { PosAbono } from '@/hooks/use-pos-abonos';
import type { PosCartLine } from '@/hooks/use-pos-cart';
import type { PosHeaderState } from '@/hooks/use-pos-header';
import { defaultPosHeader } from '@/hooks/use-pos-header';

export type PosVenta = {
    id: number;
    nombre: string;
    header: PosHeaderState;
    lines: PosCartLine[];
    abonos: PosAbono[];
};

type PosVentasState = {
    ventas: PosVenta[];
    activaId: number;
    /** Next number for a new "Venta N" tab. */
    siguiente: number;
};

/** An empty venta. It inherits what identifies the terminal (bodega,
 * vendedor, tipo de precio) from the venta it follows, when there is one. */
const ventaVacia = (id: number, previa?: PosHeaderState): PosVenta => ({
    id,
    nombre: `Venta ${id}`,
    header: {
        ...defaultPosHeader(previa?.tipoPrecio),
        bodegaId: previa?.bodegaId ?? '',
        vendedorId: previa?.vendedorId ?? '',
    },
    lines: [],
    abonos: [],
});

const estadoInicial = (): PosVentasState => ({
    ventas: [ventaVacia(1)],
    activaId: 1,
    siguiente: 2,
});

/** Reads the saved drafts; anything missing or malformed falls back to a
 * fresh single-venta state instead of breaking the POS. */
function cargar(storageKey: string): PosVentasState {
    try {
        const raw = window.localStorage.getItem(storageKey);

        if (!raw) {
            return estadoInicial();
        }

        const saved = JSON.parse(raw) as Partial<PosVentasState>;

        if (!Array.isArray(saved.ventas) || saved.ventas.length === 0) {
            return estadoInicial();
        }

        const ventas = saved.ventas.map((venta): PosVenta => ({
            id: venta.id,
            nombre: venta.nombre,
            header: { ...defaultPosHeader(), ...venta.header },
            lines: Array.isArray(venta.lines) ? venta.lines : [],
            abonos: Array.isArray(venta.abonos) ? venta.abonos : [],
        }));

        return {
            ventas,
            activaId: ventas.some((venta) => venta.id === saved.activaId)
                ? (saved.activaId as number)
                : ventas[0].id,
            siguiente:
                typeof saved.siguiente === 'number'
                    ? saved.siguiente
                    : Math.max(...ventas.map((venta) => venta.id)) + 1,
        };
    } catch {
        return estadoInicial();
    }
}

/**
 * The POS's simultaneous sales ("Venta 1", "Venta 2"…). Each venta keeps its
 * own pedido header, cart and abonos; the whole set is saved to the
 * browser's localStorage on every change, so leaving the POS (or reloading)
 * doesn't lose a sale in progress.
 */
export function usePosVentas(storageKey: string) {
    const [state, setState] = useState<PosVentasState>(() =>
        cargar(storageKey),
    );

    useEffect(() => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(state));
        } catch {
            // Storage full or unavailable: the POS keeps working, just
            // without persistence.
        }
    }, [state, storageKey]);

    const activa =
        state.ventas.find((venta) => venta.id === state.activaId) ??
        state.ventas[0];

    const updateActiva = (change: (venta: PosVenta) => PosVenta) => {
        setState((prev) => ({
            ...prev,
            ventas: prev.ventas.map((venta) =>
                venta.id === prev.activaId ? change(venta) : venta,
            ),
        }));
    };

    const slice =
        <K extends 'header' | 'lines' | 'abonos'>(key: K) =>
        (update: SetStateAction<PosVenta[K]>) =>
            updateActiva((venta) => ({
                ...venta,
                [key]:
                    typeof update === 'function'
                        ? (update as (prev: PosVenta[K]) => PosVenta[K])(
                              venta[key],
                          )
                        : update,
            }));

    const setHeader = slice('header') as Dispatch<
        SetStateAction<PosHeaderState>
    >;
    const setLines = slice('lines') as Dispatch<SetStateAction<PosCartLine[]>>;
    const setAbonos = slice('abonos') as Dispatch<SetStateAction<PosAbono[]>>;

    const seleccionar = (id: number) =>
        setState((prev) => ({ ...prev, activaId: id }));

    const nuevaVenta = () =>
        setState((prev) => ({
            ventas: [
                ...prev.ventas,
                ventaVacia(
                    prev.siguiente,
                    prev.ventas.find((venta) => venta.id === prev.activaId)
                        ?.header,
                ),
            ],
            activaId: prev.siguiente,
            siguiente: prev.siguiente + 1,
        }));

    /** Closes a venta; the last one is emptied instead of removed. */
    const cerrar = (id: number) =>
        setState((prev) => {
            if (prev.ventas.length === 1) {
                return {
                    ...prev,
                    ventas: [
                        ventaVacia(prev.ventas[0].id, prev.ventas[0].header),
                    ],
                };
            }

            const index = prev.ventas.findIndex((venta) => venta.id === id);
            const ventas = prev.ventas.filter((venta) => venta.id !== id);

            return {
                ...prev,
                ventas,
                activaId:
                    prev.activaId === id
                        ? ventas[Math.max(index - 1, 0)].id
                        : prev.activaId,
            };
        });

    /** Drops cart lines whose product no longer exists in the catalog. */
    const depurar = (productoIds: Set<number>) =>
        setState((prev) => ({
            ...prev,
            ventas: prev.ventas.map((venta) => ({
                ...venta,
                lines: venta.lines.filter((line) =>
                    productoIds.has(line.productoId),
                ),
            })),
        }));

    return {
        ventas: state.ventas,
        activa,
        setHeader,
        setLines,
        setAbonos,
        seleccionar,
        nuevaVenta,
        cerrar,
        depurar,
    };
}
