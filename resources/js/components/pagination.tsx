import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    dataTest?: string;
};

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** 1 … 4 5 6 … 20 style page list: always the first and last page, the
 * current page with one neighbor on each side, and ellipses for the gaps. */
function pageItems(page: number, totalPages: number): PageItem[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items: PageItem[] = [1];
    const start = Math.max(page - 1, 2);
    const end = Math.min(page + 1, totalPages - 1);

    if (start > 2) {
        items.push('ellipsis-start');
    }

    for (let current = start; current <= end; current++) {
        items.push(current);
    }

    if (end < totalPages - 1) {
        items.push('ellipsis-end');
    }

    items.push(totalPages);

    return items;
}

const buttonClassName =
    'hover:bg-accent inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md border px-2 text-sm disabled:pointer-events-none disabled:opacity-40';

/**
 * `‹ Anterior  1 2 3 … 20  Siguiente ›` pager, so people can jump to any
 * nearby page instead of only stepping one page at a time.
 */
export default function Pagination({
    page,
    totalPages,
    onPageChange,
    dataTest = 'pagination',
}: Props) {
    return (
        <nav
            className="flex flex-wrap items-center justify-center gap-1"
            aria-label="Paginación"
        >
            <button
                type="button"
                className={buttonClassName}
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                data-test={`${dataTest}-prev`}
            >
                <ChevronLeft className="size-4" />
                Anterior
            </button>

            {pageItems(page, totalPages).map((item) =>
                typeof item === 'number' ? (
                    <button
                        key={item}
                        type="button"
                        aria-current={item === page ? 'page' : undefined}
                        className={cn(
                            buttonClassName,
                            item === page &&
                                'bg-primary text-primary-foreground hover:bg-primary/90 border-primary',
                        )}
                        onClick={() => onPageChange(item)}
                        data-test={`${dataTest}-page-${item}`}
                    >
                        {item}
                    </button>
                ) : (
                    <span
                        key={item}
                        className="text-muted-foreground px-1 select-none"
                    >
                        …
                    </span>
                ),
            )}

            <button
                type="button"
                className={buttonClassName}
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                data-test={`${dataTest}-next`}
            >
                Siguiente
                <ChevronRight className="size-4" />
            </button>
        </nav>
    );
}
