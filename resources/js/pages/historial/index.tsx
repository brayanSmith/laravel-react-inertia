import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { index } from '@/routes/historial';
import type { HistorialActividad } from '@/types';

type Props = {
    actividades: HistorialActividad[];
};

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const cambiosTexto = (actividad: HistorialActividad) =>
    actividad.cambios
        .map(
            (cambio) =>
                `${cambio.campo}: ${cambio.antes ?? ''} ${cambio.despues ?? ''}`,
        )
        .join(' ');

export default function HistorialIndex({ actividades }: Props) {
    const columns = useMemo<DataTableColumn<HistorialActividad>[]>(
        () => [
            {
                key: 'fecha',
                label: 'Fecha',
                filter: 'date',
                width: 180,
                getValue: (actividad) => actividad.fecha,
                render: (actividad) =>
                    dateTimeFormatter.format(new Date(actividad.fecha)),
            },
            {
                key: 'usuario',
                label: 'Usuario',
                width: 160,
                getValue: (actividad) => actividad.usuario,
                render: (actividad) => actividad.usuario,
            },
            {
                key: 'modulo',
                label: 'Módulo',
                width: 110,
                getValue: (actividad) => actividad.modulo,
                render: (actividad) => (
                    <Badge variant="secondary">{actividad.modulo}</Badge>
                ),
            },
            {
                key: 'registro',
                label: 'Registro',
                width: 190,
                getValue: (actividad) => actividad.registro,
                render: (actividad) => actividad.registro,
            },
            {
                key: 'accion',
                label: 'Acción',
                width: 230,
                getValue: (actividad) => actividad.accion,
                render: (actividad) => (
                    <span className="font-medium">{actividad.accion}</span>
                ),
            },
            {
                key: 'cambios',
                label: 'Cambios',
                width: 520,
                getValue: (actividad) => cambiosTexto(actividad),
                render: (actividad) => (
                    <div className="space-y-0.5 py-1 text-xs whitespace-normal">
                        {actividad.cambios.map((cambio) => (
                            <div key={cambio.campo}>
                                <span className="font-medium">
                                    {cambio.campo}:
                                </span>{' '}
                                {cambio.antes !== null ? (
                                    <span className="text-red-600 line-through dark:text-red-400">
                                        {cambio.antes}
                                    </span>
                                ) : null}
                                {cambio.antes !== null &&
                                cambio.despues !== null
                                    ? ' → '
                                    : null}
                                {cambio.despues !== null ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        {cambio.despues}
                                    </span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <>
            <Head title="Historial de cambios" />

            <div className="flex flex-col space-y-6">
                <Heading
                    variant="small"
                    title="Historial de cambios"
                    description="Quién creó, editó o eliminó cada registro y qué cambió (pedidos, compras, productos, clientes, gastos, proveedores, stock, traslados, marcas y bodegas)"
                />

                <DataTable
                    data={actividades}
                    columns={columns}
                    getRowId={(actividad) => actividad.id}
                    dataTestPrefix="historial"
                    searchPlaceholder="Buscar en el historial..."
                    emptyMessage="Aún no hay cambios registrados."
                />
            </div>
        </>
    );
}

HistorialIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Historial de cambios',
            href: index(),
        },
    ],
});
