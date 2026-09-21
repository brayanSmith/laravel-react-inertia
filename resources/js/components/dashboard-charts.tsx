import { ChartColumn, ChartLine, ChartPie } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
    Area,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { DashboardGraficos, DashboardPermisos } from '@/types';

const numberFormatter = new Intl.NumberFormat('es-CO');

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('es-CO', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

const COLORES = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

const tooltipStyle = {
    background: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
};

type Granularidad = 'dia' | 'semana' | 'mes' | 'anio';

const GRANULARIDADES: { value: Granularidad; label: string }[] = [
    { value: 'dia', label: 'Día' },
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
    { value: 'anio', label: 'Año' },
];

const MESES = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
];

/** Start of the period (as YYYY-MM-DD) a day belongs to. Weeks start on Monday. */
function inicioDePeriodo(fecha: string, granularidad: Granularidad): string {
    if (granularidad === 'dia') {
        return fecha;
    }

    if (granularidad === 'mes') {
        return `${fecha.slice(0, 7)}-01`;
    }

    if (granularidad === 'anio') {
        return `${fecha.slice(0, 4)}-01-01`;
    }

    const date = new Date(`${fecha}T00:00:00Z`);
    const diasDesdeLunes = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - diasDesdeLunes);

    return date.toISOString().slice(0, 10);
}

function etiqueta(inicio: string, granularidad: Granularidad): string {
    const [anio, mes, dia] = inicio.split('-');
    const nombreMes = MESES[Number(mes) - 1];

    switch (granularidad) {
        case 'anio':
            return anio;
        case 'mes':
            return `${nombreMes} ${anio}`;
        case 'semana':
            return `Sem. ${Number(dia)} ${nombreMes}`;
        default:
            return `${Number(dia)} ${nombreMes}`;
    }
}

type TooltipPayload = {
    payload?: {
        categoria?: string;
        producto?: string;
        cantidad: number;
        valor: number;
    };
};

/** Tooltip for the category and best-seller charts: units and sales value. */
function TooltipCantidadValor({
    active,
    payload,
}: {
    active?: boolean;
    payload?: TooltipPayload[];
}) {
    const fila = payload?.[0]?.payload;

    if (!active || !fila) {
        return null;
    }

    return (
        <div style={tooltipStyle} className="space-y-0.5 px-3 py-2">
            <p className="font-medium">{fila.categoria ?? fila.producto}</p>
            <p>Cantidad: {numberFormatter.format(fila.cantidad)}</p>
            <p>Valor: {currencyFormatter.format(fila.valor)}</p>
        </div>
    );
}

function ChartCard({
    icon: Icon,
    title,
    action,
    dataTest,
    className,
    children,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    action?: ReactNode;
    dataTest: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <Card data-test={dataTest} className={className}>
            <CardContent className="space-y-3 px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Icon className="size-4" />
                        {title}
                    </p>
                    {action}
                </div>
                {children}
            </CardContent>
        </Card>
    );
}

function SinDatos() {
    return (
        <p className="text-muted-foreground flex h-64 items-center justify-center text-sm">
            No hay ventas para los filtros seleccionados.
        </p>
    );
}

export default function DashboardCharts({
    graficos,
    permisos,
}: {
    graficos: DashboardGraficos;
    permisos: DashboardPermisos;
}) {
    const [granularidad, setGranularidad] = useState<Granularidad>('dia');
    // Series picked from the legend; null shows all of them.
    const [serieActiva, setSerieActiva] = useState<string | null>(null);

    const serie = useMemo(() => {
        const periodos = new Map<
            string,
            { pedidos: number; ventas: number; costos: number; gastos: number }
        >();
        const periodo = (inicio: string) => {
            const actual = periodos.get(inicio) ?? {
                pedidos: 0,
                ventas: 0,
                costos: 0,
                gastos: 0,
            };
            periodos.set(inicio, actual);

            return actual;
        };

        for (const fila of graficos.pedidosPorFecha) {
            const actual = periodo(inicioDePeriodo(fila.fecha, granularidad));
            actual.pedidos += fila.pedidos;
            actual.ventas += fila.valor;
            actual.costos += fila.inversion;
        }

        for (const fila of graficos.gastosPorFecha) {
            periodo(inicioDePeriodo(fila.fecha, granularidad)).gastos +=
                fila.gastos;
        }

        return [...periodos.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([inicio, datos]) => ({
                periodo: etiqueta(inicio, granularidad),
                pedidos: datos.pedidos,
                ventas: datos.ventas,
                gastosInversion: datos.costos + datos.gastos,
                ganancia: datos.ventas - datos.costos - datos.gastos,
            }));
    }, [graficos.pedidosPorFecha, graficos.gastosPorFecha, granularidad]);

    return (
        <div className="grid gap-4 lg:grid-cols-2" data-test="dashboard-charts">
            {permisos['chart-categorias'] ? (
                <ChartCard
                    icon={ChartPie}
                    title="Productos vendidos por categoría"
                    dataTest="chart-categorias"
                >
                    {graficos.categorias.length === 0 ? (
                        <SinDatos />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        content={<TooltipCantidadValor />}
                                    />
                                    <Legend />
                                    <Pie
                                        data={graficos.categorias}
                                        dataKey="cantidad"
                                        nameKey="categoria"
                                        innerRadius="55%"
                                        outerRadius="80%"
                                        paddingAngle={2}
                                        stroke="var(--card)"
                                    >
                                        {graficos.categorias.map(
                                            (fila, index) => (
                                                <Cell
                                                    key={fila.categoria}
                                                    fill={
                                                        COLORES[
                                                            index %
                                                                COLORES.length
                                                        ]
                                                    }
                                                />
                                            ),
                                        )}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>
            ) : null}

            {permisos['chart-top-productos'] ? (
                <ChartCard
                    icon={ChartColumn}
                    title="10 productos más vendidos"
                    dataTest="chart-top-productos"
                >
                    {graficos.topProductos.length === 0 ? (
                        <SinDatos />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graficos.topProductos}>
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="var(--border)"
                                    />
                                    <XAxis
                                        dataKey="producto"
                                        tickLine={false}
                                        interval={0}
                                        angle={-30}
                                        textAnchor="end"
                                        height={70}
                                        tick={{ fontSize: 10 }}
                                        tickFormatter={(value: string) =>
                                            value.length > 14
                                                ? `${value.slice(0, 13)}…`
                                                : value
                                        }
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                        width={40}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--accent)' }}
                                        contentStyle={tooltipStyle}
                                        content={<TooltipCantidadValor />}
                                    />
                                    <Bar
                                        dataKey="cantidad"
                                        fill="var(--chart-1)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>
            ) : null}

            {permisos['chart-pedidos'] ? (
                <ChartCard
                    icon={ChartLine}
                    title="Pedidos, gastos + inversión y ganancia por fecha"
                    dataTest="chart-pedidos-fecha"
                    className="lg:col-span-2"
                    action={
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={granularidad}
                            onValueChange={(value) =>
                                value && setGranularidad(value as Granularidad)
                            }
                        >
                            {GRANULARIDADES.map((opcion) => (
                                <ToggleGroupItem
                                    key={opcion.value}
                                    value={opcion.value}
                                    data-test={`chart-granularidad-${opcion.value}`}
                                >
                                    {opcion.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    }
                >
                    {serie.length === 0 ? (
                        <SinDatos />
                    ) : (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={serie}>
                                    <defs>
                                        <linearGradient
                                            id="area-pedidos"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--chart-1)"
                                                stopOpacity={0.5}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--chart-1)"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="var(--border)"
                                    />
                                    <XAxis
                                        dataKey="periodo"
                                        tickLine={false}
                                        minTickGap={24}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        width={56}
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(value) =>
                                            compactFormatter.format(
                                                Number(value),
                                            )
                                        }
                                    />
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        formatter={(value) =>
                                            currencyFormatter.format(
                                                Number(value),
                                            )
                                        }
                                        labelFormatter={(label, items) => {
                                            const pedidos = (
                                                items?.[0]?.payload as
                                                    | { pedidos?: number }
                                                    | undefined
                                            )?.pedidos;

                                            return pedidos === undefined
                                                ? label
                                                : `${label} · ${numberFormatter.format(pedidos)} pedidos`;
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ cursor: 'pointer' }}
                                        onClick={(item) => {
                                            const clave = String(item.dataKey);
                                            setSerieActiva((actual) =>
                                                actual === clave ? null : clave,
                                            );
                                        }}
                                        formatter={(value, item) => (
                                            <span
                                                style={{
                                                    opacity:
                                                        serieActiva === null ||
                                                        serieActiva ===
                                                            String(item.dataKey)
                                                            ? 1
                                                            : 0.4,
                                                }}
                                            >
                                                {value}
                                            </span>
                                        )}
                                    />
                                    <Area
                                        hide={
                                            serieActiva !== null &&
                                            serieActiva !== 'ventas'
                                        }
                                        type="monotone"
                                        dataKey="ventas"
                                        name="Pedidos"
                                        stroke="var(--chart-1)"
                                        strokeWidth={2}
                                        fill="url(#area-pedidos)"
                                    />
                                    <Line
                                        hide={
                                            serieActiva !== null &&
                                            serieActiva !== 'gastosInversion'
                                        }
                                        type="monotone"
                                        dataKey="gastosInversion"
                                        name="Gastos + inversión"
                                        stroke="var(--chart-5)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        hide={
                                            serieActiva !== null &&
                                            serieActiva !== 'ganancia'
                                        }
                                        type="monotone"
                                        dataKey="ganancia"
                                        name="Ganancia"
                                        stroke="var(--chart-2)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>
            ) : null}
        </div>
    );
}
