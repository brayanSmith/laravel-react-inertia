import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

export function formatDate(value: string | null | undefined): string {
    return value ? new Date(value).toLocaleDateString('es-CO') : '—';
}

/** A labelled value of a record's header. */
export function Field({
    label,
    children,
    className,
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('grid gap-0.5', className)}>
            <span className="text-muted-foreground text-xs">{label}</span>
            <span className="text-sm font-medium">{children || '—'}</span>
        </div>
    );
}

/** A titled block of a record's detail (a card with a heading). */
export function Section({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {children}
        </div>
    );
}

/** One row of the totals block: a label on the left, the amount on the right. */
export function TotalRow({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: number;
    strong?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex justify-between text-sm',
                strong && 'text-base font-semibold',
            )}
        >
            <span className={strong ? '' : 'text-muted-foreground'}>
                {label}
            </span>
            <span>{currencyFormatter.format(value)}</span>
        </div>
    );
}

export function LoadingOrError({
    loading,
    failed,
}: {
    loading: boolean;
    failed: boolean;
}) {
    if (failed) {
        return (
            <p className="text-destructive py-8 text-center text-sm">
                No se pudo cargar el detalle.
            </p>
        );
    }

    if (loading) {
        return (
            <p className="text-muted-foreground py-8 text-center text-sm">
                Cargando…
            </p>
        );
    }

    return null;
}
