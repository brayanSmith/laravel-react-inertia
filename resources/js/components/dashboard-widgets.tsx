import { Package, Percent, TrendingUp } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DashboardPermisos, DashboardResumen } from '@/types';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat('es-CO');

const money = (value: number) => currencyFormatter.format(value);

function Widget({
    icon: Icon,
    title,
    value,
    hint,
    tone,
    dataTest,
    children,
    className,
}: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    value: string;
    hint?: ReactNode;
    tone?: string;
    dataTest: string;
    children?: ReactNode;
    className?: string;
}) {
    return (
        <Card data-test={dataTest} className={cn('gap-0 py-4', className)}>
            <CardContent className="space-y-1 px-5">
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Icon className="size-4" />
                    {title}
                </p>
                <p className={cn('text-2xl font-bold', tone)}>{value}</p>
                {hint ? (
                    <p className="text-muted-foreground text-xs">{hint}</p>
                ) : null}
                {children}
            </CardContent>
        </Card>
    );
}

function MiniLine({
    serie,
}: {
    serie: DashboardResumen['productosVendidos']['serie'];
}) {
    if (serie.length < 2) {
        return (
            <p className="text-muted-foreground pt-3 text-xs">
                Sin datos suficientes para el gráfico.
            </p>
        );
    }

    return (
        <div className="h-16 pt-2">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie}>
                    <XAxis dataKey="fecha" hide />
                    <Tooltip
                        cursor={false}
                        contentStyle={{
                            background: 'var(--popover)',
                            color: 'var(--popover-foreground)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                        formatter={(value) => [
                            numberFormatter.format(Number(value)),
                            'Cantidad',
                        ]}
                        labelFormatter={(label) => String(label)}
                    />
                    <Line
                        type="monotone"
                        dataKey="cantidad"
                        stroke="var(--chart-1, #2563eb)"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function DashboardWidgets({
    resumen,
    permisos,
}: {
    resumen: DashboardResumen;
    permisos: DashboardPermisos;
}) {
    const { productosVendidos, valorPedidos, ajustes } = resumen;

    return (
        <div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            data-test="dashboard-widgets"
        >
            {permisos['widget-productos'] ? (
                <Widget
                    dataTest="widget-productos-vendidos"
                    icon={Package}
                    title="Total productos vendidos"
                    value={numberFormatter.format(productosVendidos.cantidad)}
                    hint={`Valor: ${money(productosVendidos.valor)}`}
                >
                    <MiniLine serie={productosVendidos.serie} />
                </Widget>
            ) : null}

            {permisos['widget-ganancia'] ? (
                <Widget
                    dataTest="widget-ganancia"
                    icon={TrendingUp}
                    title="Valor ganancia"
                    value={money(resumen.ganancia)}
                    tone={
                        resumen.ganancia >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                    }
                    hint="Pedidos − (inversión + gastos)"
                >
                    <dl className="text-muted-foreground grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 pt-2 text-xs">
                        <dt>
                            Valor pedidos (
                            {numberFormatter.format(valorPedidos.cantidad)})
                        </dt>
                        <dd className="text-foreground">
                            {money(valorPedidos.valor)}
                        </dd>
                        <dt>Valor inversión</dt>
                        <dd className="text-foreground">
                            {money(resumen.inversion)}
                        </dd>
                        <dt>Gastos reportados</dt>
                        <dd className="text-red-600 dark:text-red-400">
                            {money(resumen.gastos)}
                        </dd>
                    </dl>
                </Widget>
            ) : null}

            {permisos['widget-ajustes'] ? (
                <Widget
                    dataTest="widget-ajustes"
                    icon={Percent}
                    title="Ajustes"
                    value={money(
                        ajustes.reteica +
                            ajustes.retefuente +
                            ajustes.descuento,
                    )}
                >
                    <dl className="text-muted-foreground grid grid-cols-[1fr_auto] gap-x-4 pt-1 text-xs">
                        <dt>Reteica</dt>
                        <dd className="text-foreground">
                            {money(ajustes.reteica)}
                        </dd>
                        <dt>Retefuente</dt>
                        <dd className="text-foreground">
                            {money(ajustes.retefuente)}
                        </dd>
                        <dt>Descuento</dt>
                        <dd className="text-foreground">
                            {money(ajustes.descuento)}
                        </dd>
                    </dl>
                </Widget>
            ) : null}
        </div>
    );
}
