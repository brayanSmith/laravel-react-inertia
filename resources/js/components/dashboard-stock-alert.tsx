import { ChevronDown, CircleCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ProductoSinStock } from '@/types';

const numberFormatter = new Intl.NumberFormat('es-CO');

/**
 * The products that ran out of stock but keep selling: what to restock first.
 * Collapsible, so it can be tucked away once it has been seen.
 */
export default function DashboardStockAlert({
    productos,
}: {
    productos: ProductoSinStock[];
}) {
    const [open, setOpen] = useState(true);

    if (productos.length === 0) {
        return (
            <Card
                data-test="dashboard-stock-alert"
                className="gap-0 border-emerald-200 bg-emerald-50 py-4 dark:border-emerald-900 dark:bg-emerald-950/30"
            >
                <CardContent className="flex items-center gap-3 px-5 text-sm text-emerald-700 dark:text-emerald-300">
                    <CircleCheck className="size-5" />
                    Ningún producto con ventas se ha quedado sin stock.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            data-test="dashboard-stock-alert"
            className="gap-0 border-red-200 bg-red-50/60 py-4 dark:border-red-900 dark:bg-red-950/20"
        >
            <CardContent className="space-y-3 px-5">
                <button
                    type="button"
                    onClick={() => setOpen((current) => !current)}
                    aria-expanded={open}
                    data-test="dashboard-stock-alert-toggle"
                    className="flex w-full items-start gap-3 text-left"
                >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                        <TriangleAlert className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-red-700 dark:text-red-300">
                            Productos sin stock que se siguen vendiendo
                        </p>
                        <p className="text-muted-foreground text-xs">
                            Los {productos.length} más vendidos del periodo que
                            ya no tienen existencias. Conviene reponerlos.
                        </p>
                    </div>
                    <ChevronDown
                        className={cn(
                            'mt-1 size-5 shrink-0 text-red-600 transition-transform dark:text-red-300',
                            !open && '-rotate-90',
                        )}
                    />
                </button>

                {open ? (
                    <ol className="divide-y divide-red-100 dark:divide-red-900/40">
                        {productos.map((producto, index) => (
                            <li
                                key={producto.id}
                                data-test="dashboard-stock-alert-row"
                                className="flex items-center gap-3 py-2 text-sm"
                            >
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
                                    {index + 1}
                                </span>
                                <span
                                    className="min-w-0 flex-1 truncate font-medium"
                                    title={producto.producto}
                                >
                                    {producto.producto}
                                </span>
                                <span className="text-muted-foreground shrink-0 text-xs">
                                    {numberFormatter.format(producto.vendidas)}{' '}
                                    vendidas
                                </span>
                                <Badge className="shrink-0 border-transparent bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300">
                                    {producto.stock < 0
                                        ? `Stock ${numberFormatter.format(producto.stock)}`
                                        : 'Sin stock'}
                                </Badge>
                            </li>
                        ))}
                    </ol>
                ) : null}
            </CardContent>
        </Card>
    );
}
