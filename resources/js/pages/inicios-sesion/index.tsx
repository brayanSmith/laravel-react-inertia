import { Head, router, usePoll } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/inicios-sesion';
import type { InicioSesion } from '@/types';

type Props = {
    inicios: InicioSesion[];
};

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const DISPOSITIVOS = ['Escritorio', 'Móvil', 'Tablet'].map((value) => ({
    value,
    label: value,
}));

export default function IniciosSesionIndex({ inicios }: Props) {
    const [actualizando, setActualizando] = useState(false);

    // New logins show up on their own: the list is re-fetched every 30 s
    // (only this prop, no full reload), or right away with the button.
    usePoll(30000, { only: ['inicios'] });

    const actualizar = () =>
        router.reload({
            only: ['inicios'],
            onStart: () => setActualizando(true),
            onFinish: () => setActualizando(false),
        });

    const columns = useMemo<DataTableColumn<InicioSesion>[]>(
        () => [
            {
                key: 'fecha',
                label: 'Fecha',
                filter: 'date',
                width: 190,
                getValue: (inicio) => inicio.created_at,
                render: (inicio) =>
                    dateTimeFormatter.format(new Date(inicio.created_at)),
            },
            {
                key: 'usuario',
                label: 'Usuario',
                getValue: (inicio) => inicio.nombre,
                render: (inicio) => inicio.nombre,
            },
            {
                key: 'email',
                label: 'Email',
                width: 220,
                getValue: (inicio) => inicio.email,
                render: (inicio) => inicio.email,
            },
            {
                key: 'ip',
                label: 'IP',
                width: 140,
                getValue: (inicio) => inicio.ip ?? '',
                render: (inicio) => inicio.ip ?? '—',
            },
            {
                key: 'navegador',
                label: 'Navegador',
                width: 140,
                getValue: (inicio) => inicio.navegador ?? '',
                render: (inicio) => inicio.navegador ?? '—',
            },
            {
                key: 'sistema_operativo',
                label: 'Sistema operativo',
                width: 160,
                getValue: (inicio) => inicio.sistema_operativo ?? '',
                render: (inicio) => inicio.sistema_operativo ?? '—',
            },
            {
                key: 'dispositivo',
                label: 'Dispositivo',
                filter: 'select',
                selectOptions: DISPOSITIVOS,
                width: 140,
                getValue: (inicio) => inicio.dispositivo ?? '',
                render: (inicio) =>
                    inicio.dispositivo ? (
                        <Badge variant="secondary">{inicio.dispositivo}</Badge>
                    ) : (
                        '—'
                    ),
            },
        ],
        [],
    );

    return (
        <>
            <Head title="Inicios de sesión" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <Heading
                        variant="small"
                        title="Inicios de sesión"
                        description="Historial de accesos de los usuarios del equipo (los 2.000 más recientes)"
                    />

                    <Button
                        type="button"
                        variant="outline"
                        disabled={actualizando}
                        onClick={actualizar}
                        data-test="inicios-sesion-actualizar"
                    >
                        <RefreshCw
                            className={actualizando ? 'animate-spin' : ''}
                        />
                        Actualizar
                    </Button>
                </div>

                <DataTable
                    data={inicios}
                    columns={columns}
                    getRowId={(inicio) => inicio.id}
                    dataTestPrefix="inicio-sesion"
                    searchPlaceholder="Buscar inicios de sesión..."
                    emptyMessage="Aún no hay inicios de sesión registrados."
                />
            </div>
        </>
    );
}

IniciosSesionIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Inicios de sesión',
            href: index(),
        },
    ],
});
