import { useMemo } from 'react';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import type { CantidadPorBodega, CantidadPorBodegaFila } from '@/types';

const numberFormatter = new Intl.NumberFormat('es-CO');

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

function Celda({
    cantidad,
    valor,
    destacada = false,
    calor = 0,
}: {
    cantidad: number;
    valor: number;
    destacada?: boolean;
    /** 0–1: how hot the cell is on the heat map; 0 leaves it plain. */
    calor?: number;
}) {
    // Green scale (emerald-600); once it gets dark the text turns white.
    const opacidad = calor > 0 ? 0.12 + calor * 0.88 : 0;
    const oscura = opacidad > 0.55;

    return (
        <div
            className={
                'flex flex-col items-end rounded-md px-2 py-1 leading-tight' +
                (oscura ? ' text-white' : '')
            }
            style={
                calor > 0
                    ? { backgroundColor: `rgb(5 150 105 / ${opacidad})` }
                    : undefined
            }
        >
            <span className={destacada ? 'font-bold' : undefined}>
                {numberFormatter.format(cantidad)}
            </span>
            <span
                className={
                    'text-xs font-normal ' +
                    (oscura ? 'text-white/80' : 'text-muted-foreground')
                }
            >
                {currencyFormatter.format(valor)}
            </span>
        </div>
    );
}

type Columna = 'NUEVO' | 'USADO' | 'SERVICIO' | 'total';

const COLUMNAS: { key: Columna; label: string }[] = [
    { key: 'NUEVO', label: 'Nuevo' },
    { key: 'USADO', label: 'Usado' },
    { key: 'SERVICIO', label: 'Servicios' },
    { key: 'total', label: 'Total' },
];

export default function CantidadPorBodegaTable({
    data,
}: {
    data: CantidadPorBodega;
}) {
    // Heat map on "Total": each bodega's share of the busiest one.
    const maxTotal = useMemo(
        () => Math.max(0, ...data.filas.map((fila) => fila.total)),
        [data.filas],
    );

    const columns = useMemo<DataTableColumn<CantidadPorBodegaFila>[]>(
        () => [
            {
                key: 'almacen',
                label: 'Almacén',
                getValue: (fila) => fila.almacen,
                render: (fila) => fila.almacen,
                footer: () => 'Total Sum',
            },
            ...COLUMNAS.map(
                ({ key, label }): DataTableColumn<CantidadPorBodegaFila> => ({
                    key,
                    label,
                    align: 'right',
                    width: 160,
                    getValue: (fila) => fila[key],
                    render: (fila) => (
                        <Celda
                            cantidad={fila[key]}
                            valor={fila.valores[key]}
                            destacada={key === 'total'}
                            calor={
                                key === 'total' && maxTotal > 0
                                    ? fila.total / maxTotal
                                    : 0
                            }
                        />
                    ),
                    footer: (filas) => (
                        <Celda
                            cantidad={filas.reduce(
                                (suma, fila) => suma + fila[key],
                                0,
                            )}
                            valor={filas.reduce(
                                (suma, fila) => suma + fila.valores[key],
                                0,
                            )}
                            destacada
                        />
                    ),
                }),
            ),
        ],
        [maxTotal],
    );

    return (
        <div className="space-y-3" data-test="cantidad-por-bodega">
            <h2 className="text-sm font-semibold">
                Cantidad de productos por bodega
            </h2>

            <DataTable
                data={data.filas}
                columns={columns}
                getRowId={(fila) => fila.almacen}
                dataTestPrefix="cantidad-bodega"
                toolbar={false}
                emptyMessage="Aún no hay ventas registradas."
                paginate={false}
            />
        </div>
    );
}
