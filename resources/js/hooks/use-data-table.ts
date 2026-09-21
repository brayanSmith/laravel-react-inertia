import type {
    DragEvent as ReactDragEvent,
    MouseEvent as ReactMouseEvent,
    ReactNode,
} from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { DateRangeValue } from '@/components/date-range-filter';

export type DataTableFilterVariant = 'text' | 'select' | 'date' | 'none';

export type DataTableSelectOption = {
    value: string;
    label: string;
};

export type DataTableColumn<T> = {
    /** Unique, stable column identifier (also used as the sort/filter key). */
    key: string;
    label: string;
    align?: 'right';
    /** Defaults to true, except when `filter` is `'none'`. */
    sortable?: boolean;
    /** Defaults to `'text'`. */
    filter?: DataTableFilterVariant;
    /** Required when `filter` is `'select'`. */
    selectOptions?: DataTableSelectOption[];
    /** Whether this column can be hidden via the "Columns" menu. Defaults to true, except when `filter` is `'none'`. */
    hideable?: boolean;
    /** Initial column width in pixels. */
    width?: number;
    /** Used for sorting, filtering and (by default) searching. Omit for columns that are purely presentational. */
    getValue?: (row: T) => string | number;
    render: (row: T) => ReactNode;
    /** Cell of the summary row, computed over the rows that pass the current filters. */
    footer?: (rows: T[]) => ReactNode;
};

export type SortDirection = 'asc' | 'desc';

export type DataTableSort = {
    key: string;
    direction: SortDirection;
};

export type HeaderCellHandlers = {
    onResizeStart: (event: ReactMouseEvent) => void;
    onDragStart: (event: ReactDragEvent) => void;
    onDragOver: (event: ReactDragEvent) => void;
    onDrop: (event: ReactDragEvent) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    isDragOver: boolean;
    cellRef: (element: HTMLTableCellElement | null) => void;
};

const MIN_COLUMN_WIDTH = 60;
const DEFAULT_COLUMN_WIDTH = 160;
const DEFAULT_PAGE_SIZE = 25;

export type UseDataTableOptions<T> = {
    data: T[];
    columns: DataTableColumn<T>[];
    pageSize?: number;
    /** Set to false to show every row without paging. Defaults to true. */
    paginate?: boolean;
    /** Overrides the default (all columns with `getValue`, joined) search text builder. */
    searchableText?: (row: T) => string;
};

function normalizeColumn<T>(
    column: DataTableColumn<T>,
): Required<
    Pick<DataTableColumn<T>, 'sortable' | 'filter' | 'hideable' | 'width'>
> &
    DataTableColumn<T> {
    const filter = column.filter ?? 'text';

    return {
        ...column,
        filter,
        sortable: column.sortable ?? filter !== 'none',
        hideable: column.hideable ?? filter !== 'none',
        width: column.width ?? DEFAULT_COLUMN_WIDTH,
    };
}

/**
 * Encapsulates the full "advanced table" behavior shared across the app's
 * index pages: search, per-column sort/filter, resizable + draggable
 * (with FLIP animation) columns, show/hide columns, and client-side
 * pagination. Pair with the `DataTable` component, or consume directly for
 * a fully custom layout.
 */
export function useDataTable<T>({
    data,
    columns,
    pageSize: requestedPageSize = DEFAULT_PAGE_SIZE,
    paginate = true,
    searchableText,
}: UseDataTableOptions<T>) {
    const pageSize = paginate ? requestedPageSize : Number.MAX_SAFE_INTEGER;
    const normalizedColumns = useMemo(
        () => columns.map(normalizeColumn),
        [columns],
    );
    const columnsMap = useMemo(
        () => new Map(normalizedColumns.map((column) => [column.key, column])),
        [normalizedColumns],
    );
    const columnKeys = useMemo(
        () => normalizedColumns.map((column) => column.key),
        [normalizedColumns],
    );
    const hideableColumns = useMemo(
        () => normalizedColumns.filter((column) => column.hideable),
        [normalizedColumns],
    );

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<DataTableSort | null>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [dateRanges, setDateRanges] = useState<
        Record<string, DateRangeValue>
    >({});
    const [page, setPage] = useState(1);

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
        () =>
            Object.fromEntries(
                normalizedColumns.map((column) => [column.key, column.width]),
            ),
    );
    const [columnOrder, setColumnOrder] = useState<string[]>(columnKeys);
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

    // Keeps widths/order in sync if the column set itself changes at
    // runtime (e.g. dynamic columns). Self-healing: `visibleColumnOrder`
    // below never trusts stale keys regardless of when this effect runs.
    useEffect(() => {
        setColumnWidths((prev) => {
            const missing = columnKeys.filter((key) => !(key in prev));

            if (missing.length === 0) {
                return prev;
            }

            const next = { ...prev };
            missing.forEach((key) => {
                next[key] = columnsMap.get(key)?.width ?? DEFAULT_COLUMN_WIDTH;
            });

            return next;
        });

        setColumnOrder((prev) => {
            const sameSet =
                prev.length === columnKeys.length &&
                columnKeys.every((key) => prev.includes(key));

            return sameSet ? prev : columnKeys;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columnKeys]);

    const [draggedKey, setDraggedKey] = useState<string | null>(null);
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);
    const resizingKeyRef = useRef<string | null>(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);
    const headerRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
    const pendingFlipRef = useRef<Map<string, DOMRect> | null>(null);

    const registerHeaderRef =
        (key: string) => (element: HTMLTableCellElement | null) => {
            if (element) {
                headerRefs.current.set(key, element);
            } else {
                headerRefs.current.delete(key);
            }
        };

    /**
     * FLIP animation: capture every header cell's current position before
     * the reorder commits, then slide each one from its old spot to its
     * new one instead of snapping instantly, so drag-drop reads as "this
     * column moved" rather than a hard jump.
     */
    useLayoutEffect(() => {
        const prevRects = pendingFlipRef.current;

        if (!prevRects) {
            return;
        }

        pendingFlipRef.current = null;

        headerRefs.current.forEach((element, key) => {
            const prevRect = prevRects.get(key);

            if (!prevRect) {
                return;
            }

            const newRect = element.getBoundingClientRect();
            const deltaX = prevRect.left - newRect.left;

            if (deltaX === 0) {
                return;
            }

            element.style.transition = 'none';
            element.style.transform = `translateX(${deltaX}px)`;

            void element.getBoundingClientRect();

            requestAnimationFrame(() => {
                element.style.transition = 'transform 200ms ease';
                element.style.transform = '';
            });
        });
    }, [columnOrder]);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const key = resizingKeyRef.current;

            if (!key) {
                return;
            }

            const delta = event.clientX - resizeStartXRef.current;

            setColumnWidths((prev) => ({
                ...prev,
                [key]: Math.max(
                    resizeStartWidthRef.current + delta,
                    MIN_COLUMN_WIDTH,
                ),
            }));
        };

        const handleMouseUp = () => {
            resizingKeyRef.current = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResize = (key: string) => (event: ReactMouseEvent) => {
        event.preventDefault();
        resizingKeyRef.current = key;
        resizeStartXRef.current = event.clientX;
        resizeStartWidthRef.current = columnWidths[key] ?? DEFAULT_COLUMN_WIDTH;
    };

    const handleColumnDrop = (key: string) => (event: ReactDragEvent) => {
        event.preventDefault();
        setDragOverKey(null);

        if (!draggedKey || draggedKey === key) {
            setDraggedKey(null);
            return;
        }

        const prevRects = new Map<string, DOMRect>();
        headerRefs.current.forEach((element, columnKey) => {
            prevRects.set(columnKey, element.getBoundingClientRect());
        });
        pendingFlipRef.current = prevRects;

        setColumnOrder((prev) => {
            const next = [...prev];
            const fromIndex = next.indexOf(draggedKey);
            const toIndex = next.indexOf(key);

            if (fromIndex === -1 || toIndex === -1) {
                return prev;
            }

            next.splice(fromIndex, 1);
            next.splice(toIndex, 0, draggedKey);

            return next;
        });

        setDraggedKey(null);
    };

    const getHeaderCellHandlers = (key: string): HeaderCellHandlers => ({
        onResizeStart: startResize(key),
        onDragStart: (event) => {
            setDraggedKey(key);
            event.dataTransfer.effectAllowed = 'move';
        },
        onDragOver: (event) => {
            event.preventDefault();

            if (dragOverKey !== key) {
                setDragOverKey(key);
            }
        },
        onDrop: handleColumnDrop(key),
        onDragEnd: () => {
            setDraggedKey(null);
            setDragOverKey(null);
        },
        isDragging: draggedKey === key,
        isDragOver: dragOverKey === key && draggedKey !== key,
        cellRef: registerHeaderRef(key),
    });

    const toggleColumnVisibility = (key: string) => {
        setHiddenColumns((prev) => {
            const next = new Set(prev);

            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
                setFilters((filtersPrev) => {
                    const { [key]: _removed, ...rest } = filtersPrev;

                    return rest;
                });
                setDateRanges((rangesPrev) => {
                    const { [key]: _removed, ...rest } = rangesPrev;

                    return rest;
                });
            }

            return next;
        });
    };

    const visibleColumnOrder = useMemo(() => {
        const known = new Set(columnKeys);
        const merged = columnOrder.filter((key) => known.has(key));

        columnKeys.forEach((key) => {
            if (!merged.includes(key)) {
                merged.push(key);
            }
        });

        return merged.filter((key) => !hiddenColumns.has(key));
    }, [columnOrder, columnKeys, hiddenColumns]);

    const handleSort = (key: string) => {
        setSort((prev) =>
            prev?.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    const setFilter = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const setDateRange = (key: string, value: DateRangeValue) => {
        setDateRanges((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({});
        setDateRanges({});
    };

    const activeFilterCount =
        Object.values(filters).filter((value) => value.trim() !== '').length +
        Object.values(dateRanges).filter((range) => range.from || range.to)
            .length;

    const getSortValue = (row: T, key: string): string | number =>
        columnsMap.get(key)?.getValue?.(row) ?? '';

    const defaultSearchableText = (row: T): string =>
        normalizedColumns
            .filter((column) => column.getValue)
            .map((column) => String(column.getValue!(row)))
            .join(' ')
            .toLowerCase();

    const getSearchText = searchableText ?? defaultSearchableText;

    const filteredSorted = useMemo(() => {
        const term = search.trim().toLowerCase();

        let list = data.filter((row) => {
            if (term && !getSearchText(row).toLowerCase().includes(term)) {
                return false;
            }

            for (const [key, value] of Object.entries(filters)) {
                if (!value.trim()) {
                    continue;
                }

                const column = columnsMap.get(key);
                const cellValue = String(getSortValue(row, key))
                    .toLowerCase()
                    .trim();

                if (column?.filter === 'select') {
                    if (cellValue !== value.toLowerCase().trim()) {
                        return false;
                    }
                } else if (!cellValue.includes(value.toLowerCase().trim())) {
                    return false;
                }
            }

            for (const [key, range] of Object.entries(dateRanges)) {
                if (!range.from && !range.to) {
                    continue;
                }

                const raw = getSortValue(row, key);
                const time = raw ? new Date(raw).getTime() : NaN;

                if (Number.isNaN(time)) {
                    return false;
                }

                if (
                    range.from &&
                    time < new Date(`${range.from}T00:00:00`).getTime()
                ) {
                    return false;
                }

                if (
                    range.to &&
                    time > new Date(`${range.to}T23:59:59.999`).getTime()
                ) {
                    return false;
                }
            }

            return true;
        });

        if (sort) {
            list = [...list].sort((a, b) => {
                const valueA = getSortValue(a, sort.key);
                const valueB = getSortValue(b, sort.key);

                const comparison =
                    typeof valueA === 'number' && typeof valueB === 'number'
                        ? valueA - valueB
                        : String(valueA).localeCompare(String(valueB), 'es', {
                              sensitivity: 'base',
                          });

                return sort.direction === 'asc' ? comparison : -comparison;
            });
        }

        return list;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, search, filters, dateRanges, sort, columnsMap]);

    const totalPages = Math.max(Math.ceil(filteredSorted.length / pageSize), 1);
    const currentPage = Math.min(page, totalPages);

    const paginatedRows = useMemo(
        () =>
            filteredSorted.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize,
            ),
        [filteredSorted, currentPage, pageSize],
    );

    useEffect(() => {
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filters, dateRanges, sort]);

    return {
        columns: normalizedColumns,
        hideableColumns,
        columnsMap,
        visibleColumnOrder,
        columnWidths,
        hiddenColumns,
        toggleColumnVisibility,
        getHeaderCellHandlers,
        sort,
        handleSort,
        search,
        setSearch,
        filters,
        setFilter,
        dateRanges,
        setDateRange,
        clearFilters,
        activeFilterCount,
        rows: paginatedRows,
        totalRows: filteredSorted.length,
        page: currentPage,
        setPage,
        totalPages,
        pageSize,
    };
}
