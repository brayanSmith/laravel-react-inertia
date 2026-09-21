import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Columns3,
    GripVertical,
    Minus,
    Plus,
    Search,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Fragment,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import type { Bodega, StockBodega } from '@/types';

type Props = {
    stockBodegas: StockBodega[];
    productos: NonNullable<StockBodega['producto']>[];
    bodegas: Bodega[];
};

type Vista = 'stock' | 'inversion';

type StaticColumnKey =
    | 'producto'
    | 'stockTotal'
    | 'valorVenta'
    | 'valorMayor'
    | 'costo'
    | 'total'
    | 'totalCosto'
    | 'valorUndInversion'
    | 'valorTotalInversion';

// Bodega columns are dynamic (one per warehouse seen in the data), so their
// keys are built as `bodega:<id>` and are not part of this static union.
type ColumnKey = StaticColumnKey | string;

type ColumnMeta = {
    key: ColumnKey;
    label: string;
    align?: 'right';
    sortable: boolean;
    filterable: boolean;
};

const BODEGA_PREFIX = 'bodega:';

function bodegaColumnKey(bodegaId: number): string {
    return `${BODEGA_PREFIX}${bodegaId}`;
}

function bodegaIdFromColumnKey(key: string): number | null {
    if (!key.startsWith(BODEGA_PREFIX)) {
        return null;
    }

    const id = Number(key.slice(BODEGA_PREFIX.length));

    return Number.isNaN(id) ? null : id;
}

const PRODUCTO_COLUMN: ColumnMeta = {
    key: 'producto',
    label: 'Producto',
    sortable: true,
    filterable: true,
};

const STOCK_COLUMN: ColumnMeta = {
    key: 'stockTotal',
    label: 'Stock',
    sortable: true,
    filterable: true,
    align: 'right',
};

const VALOR_VENTA_COLUMN: ColumnMeta = {
    key: 'valorVenta',
    label: 'Valor venta',
    sortable: true,
    filterable: true,
    align: 'right',
};

const VALOR_MAYOR_COLUMN: ColumnMeta = {
    key: 'valorMayor',
    label: 'Valor x mayor',
    sortable: true,
    filterable: true,
    align: 'right',
};

const COSTO_COLUMN: ColumnMeta = {
    key: 'costo',
    label: 'Costo',
    sortable: true,
    filterable: true,
    align: 'right',
};

const TOTAL_COLUMN: ColumnMeta = {
    key: 'total',
    label: 'Total',
    sortable: true,
    filterable: true,
    align: 'right',
};

const TOTAL_COSTO_COLUMN: ColumnMeta = {
    key: 'totalCosto',
    label: 'Total costo',
    sortable: true,
    filterable: true,
    align: 'right',
};

const VALOR_UND_INVERSION_COLUMN: ColumnMeta = {
    key: 'valorUndInversion',
    label: 'Valor und inversión',
    sortable: true,
    filterable: true,
    align: 'right',
};

const VALOR_TOTAL_INVERSION_COLUMN: ColumnMeta = {
    key: 'valorTotalInversion',
    label: 'Valor total inversión',
    sortable: true,
    filterable: true,
    align: 'right',
};

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
    producto: 260,
    stockTotal: 110,
    valorVenta: 140,
    valorMayor: 140,
    costo: 130,
    total: 150,
    totalCosto: 150,
    valorUndInversion: 170,
    valorTotalInversion: 180,
};

const DEFAULT_BODEGA_COLUMN_WIDTH = 140;
const MIN_COLUMN_WIDTH = 60;

const numberFormatter = new Intl.NumberFormat('es-CO');

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

type BodegaOption = {
    id: number;
    nombre: string;
};

type ProductoStockRow = {
    productoId: number;
    label: string;
    producto?: StockBodega['producto'];
    porBodega: Map<number, StockBodega>;
};

function bodegaStock(row: ProductoStockRow, bodegaId: number): number {
    return Number(row.porBodega.get(bodegaId)?.stock ?? 0);
}

function totalStock(row: ProductoStockRow): number {
    return Array.from(row.porBodega.values()).reduce(
        (sum, entry) => sum + Number(entry.stock ?? 0),
        0,
    );
}

function valorVenta(row: ProductoStockRow): number {
    return Number(row.producto?.valor_detal ?? 0);
}

function valorMayor(row: ProductoStockRow): number {
    return Number(row.producto?.valor_mayorista ?? 0);
}

function costoUnitario(row: ProductoStockRow): number {
    return Number(row.producto?.costo_producto ?? 0);
}

function totalVenta(row: ProductoStockRow): number {
    return valorVenta(row) * totalStock(row);
}

function totalCosto(row: ProductoStockRow): number {
    return costoUnitario(row) * totalStock(row);
}

function valorUndInversion(row: ProductoStockRow): number {
    return valorVenta(row) - costoUnitario(row);
}

function valorTotalInversion(row: ProductoStockRow): number {
    return valorUndInversion(row) * totalStock(row);
}

function getSortValue(row: ProductoStockRow, key: ColumnKey): string | number {
    switch (key) {
        case 'producto':
            return row.label;
        case 'stockTotal':
            return totalStock(row);
        case 'valorVenta':
            return valorVenta(row);
        case 'valorMayor':
            return valorMayor(row);
        case 'costo':
            return costoUnitario(row);
        case 'total':
            return totalVenta(row);
        case 'totalCosto':
            return totalCosto(row);
        case 'valorUndInversion':
            return valorUndInversion(row);
        case 'valorTotalInversion':
            return valorTotalInversion(row);
        default: {
            const bodegaId = bodegaIdFromColumnKey(key);

            return bodegaId !== null ? bodegaStock(row, bodegaId) : '';
        }
    }
}

function searchableText(
    row: ProductoStockRow,
    bodegas: BodegaOption[],
): string {
    return [
        row.label,
        totalStock(row),
        valorVenta(row),
        valorMayor(row),
        costoUnitario(row),
        ...bodegas.map((bodega) => bodegaStock(row, bodega.id)),
    ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();
}

function TruncatedCell({ value }: { value: string }) {
    return (
        <span className="block truncate" title={value}>
            {value}
        </span>
    );
}

function ValueBadge({ value }: { value: number }) {
    const has = value > 0;

    return (
        <Badge
            className={cn(
                'border-transparent',
                has
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-red-100 text-red-700 hover:bg-red-100',
            )}
        >
            {numberFormatter.format(value)}
        </Badge>
    );
}

function CurrencyBadge({
    value,
    colorClassName,
}: {
    value: number;
    colorClassName: string;
}) {
    return (
        <Badge className={cn('border-transparent', colorClassName)}>
            {currencyFormatter.format(value)}
        </Badge>
    );
}

function ResizeHandle({
    onMouseDown,
}: {
    onMouseDown: (event: React.MouseEvent) => void;
}) {
    return (
        <span
            onMouseDown={onMouseDown}
            className="hover:bg-primary/50 absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize touch-none select-none"
        />
    );
}

type FilterCellProps = {
    filterKey: ColumnKey;
    value: string;
    onChange: (key: ColumnKey, value: string) => void;
    align?: 'left' | 'right';
};

function FilterCell({
    filterKey,
    value,
    onChange,
    align = 'left',
}: FilterCellProps) {
    return (
        <TableHead className={align === 'right' ? 'text-right' : undefined}>
            <Input
                value={value}
                onChange={(event) => onChange(filterKey, event.target.value)}
                placeholder="Filtrar..."
                className="h-8 text-xs"
                data-test={`stock-bodegas-filter-${filterKey}`}
            />
        </TableHead>
    );
}

type HeaderCellProps = {
    meta: ColumnMeta;
    activeSortKey: ColumnKey | null;
    sortDirection: 'asc' | 'desc';
    onSort: (key: ColumnKey) => void;
    onResizeStart: (event: React.MouseEvent) => void;
    onDragStart: (event: React.DragEvent) => void;
    onDragOver: (event: React.DragEvent) => void;
    onDrop: (event: React.DragEvent) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    isDragOver: boolean;
    cellRef: (element: HTMLTableCellElement | null) => void;
};

function HeaderCell({
    meta,
    activeSortKey,
    sortDirection,
    onSort,
    onResizeStart,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    isDragging,
    isDragOver,
    cellRef,
}: HeaderCellProps) {
    const isActive = meta.sortable && activeSortKey === meta.key;
    const Icon = isActive
        ? sortDirection === 'asc'
            ? ArrowUp
            : ArrowDown
        : ArrowUpDown;
    const isRight = meta.align === 'right';

    return (
        <TableHead
            ref={cellRef}
            className={cn(
                'relative transition-[background-color,opacity] duration-150',
                isRight && 'text-right',
                isDragOver && 'bg-accent',
                isDragging && 'opacity-40',
            )}
        >
            <div
                draggable
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                className={cn(
                    'inline-flex cursor-grab items-center gap-1 active:cursor-grabbing',
                    isRight && 'flex-row-reverse',
                )}
            >
                <GripVertical className="text-muted-foreground/40 size-3 shrink-0" />
                {meta.sortable ? (
                    <button
                        type="button"
                        onClick={() => onSort(meta.key)}
                        className={cn(
                            'hover:text-foreground inline-flex items-center gap-1',
                            isRight && 'flex-row-reverse',
                            isActive
                                ? 'text-foreground'
                                : 'text-muted-foreground',
                        )}
                    >
                        {meta.label}
                        <Icon className="size-3.5" />
                    </button>
                ) : (
                    <span className="text-muted-foreground">{meta.label}</span>
                )}
            </div>
            <ResizeHandle onMouseDown={onResizeStart} />
        </TableHead>
    );
}

function ExpandedDetail({
    row,
    bodegas,
}: {
    row: ProductoStockRow;
    bodegas: BodegaOption[];
}) {
    return (
        <div className="bg-muted/30 rounded-md border p-3">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-muted-foreground text-xs">
                        <th className="px-2 py-1.5 text-left font-medium">
                            Bodega
                        </th>
                        <th className="px-2 py-1.5 text-right font-medium">
                            Stock inicial
                        </th>
                        <th className="px-2 py-1.5 text-right font-medium">
                            Entradas
                        </th>
                        <th className="px-2 py-1.5 text-right font-medium">
                            Salidas
                        </th>
                        <th className="px-2 py-1.5 text-right font-medium">
                            Stock
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {bodegas.map((bodega) => {
                        const entry = row.porBodega.get(bodega.id);

                        return (
                            <tr
                                key={bodega.id}
                                data-test="stock-bodega-detail-row"
                            >
                                <td className="px-2 py-1.5">{bodega.nombre}</td>
                                <td className="px-2 py-1.5 text-right">
                                    {numberFormatter.format(
                                        Number(entry?.stock_inicial ?? 0),
                                    )}
                                </td>
                                <td className="px-2 py-1.5 text-right">
                                    <div className="flex justify-end">
                                        <ValueBadge
                                            value={Number(entry?.entradas ?? 0)}
                                        />
                                    </div>
                                </td>
                                <td className="px-2 py-1.5 text-right">
                                    <div className="flex justify-end">
                                        <ValueBadge
                                            value={Number(entry?.salidas ?? 0)}
                                        />
                                    </div>
                                </td>
                                <td className="px-2 py-1.5 text-right">
                                    <div className="flex justify-end">
                                        <ValueBadge
                                            value={Number(entry?.stock ?? 0)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default function StockBodegasTable({
    stockBodegas,
    productos,
    bodegas: bodegasProp,
}: Props) {
    const [vista, setVista] = useState<Vista>('stock');
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<ColumnKey | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState<Partial<Record<ColumnKey, string>>>(
        {},
    );
    const [page, setPage] = useState(1);
    const pageSize = 25;
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const bodegas = useMemo<BodegaOption[]>(
        () =>
            bodegasProp
                .map((bodega) => ({
                    id: bodega.id,
                    nombre: bodega.nombre_bodega,
                }))
                .sort((x, y) => x.nombre.localeCompare(y.nombre, 'es')),
        [bodegasProp],
    );

    const rows = useMemo<ProductoStockRow[]>(() => {
        const map = new Map<number, ProductoStockRow>();

        // Every product is listed; pairs missing from `stockBodegas` are 0.
        productos.forEach((producto) => {
            map.set(producto.id, {
                productoId: producto.id,
                label:
                    producto.concatenar_codigo_nombre ??
                    producto.referencia_producto ??
                    `Producto ${producto.id}`,
                producto,
                porBodega: new Map(),
            });
        });

        stockBodegas.forEach((stockBodega) => {
            map.get(stockBodega.producto_id)?.porBodega.set(
                stockBodega.bodega_id,
                stockBodega,
            );
        });

        return Array.from(map.values()).sort((x, y) =>
            x.label.localeCompare(y.label, 'es'),
        );
    }, [productos, stockBodegas]);

    const columnDefs = useMemo<ColumnMeta[]>(() => {
        const bodegaColumns = bodegas.map((bodega): ColumnMeta => ({
            key: bodegaColumnKey(bodega.id),
            label: bodega.nombre,
            sortable: true,
            filterable: true,
            align: 'right',
        }));

        if (vista === 'inversion') {
            return [
                STOCK_COLUMN,
                PRODUCTO_COLUMN,
                VALOR_VENTA_COLUMN,
                VALOR_MAYOR_COLUMN,
                COSTO_COLUMN,
                ...bodegaColumns,
                TOTAL_COLUMN,
                TOTAL_COSTO_COLUMN,
                VALOR_UND_INVERSION_COLUMN,
                VALOR_TOTAL_INVERSION_COLUMN,
            ];
        }

        return [STOCK_COLUMN, PRODUCTO_COLUMN, ...bodegaColumns];
    }, [bodegas, vista]);

    const columnDefsMap = useMemo(
        () => new Map(columnDefs.map((meta) => [meta.key, meta])),
        [columnDefs],
    );
    const columnKeys = useMemo(
        () => columnDefs.map((meta) => meta.key),
        [columnDefs],
    );

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
        () =>
            Object.fromEntries(
                columnKeys.map((key) => [
                    key,
                    DEFAULT_COLUMN_WIDTHS[key] ?? DEFAULT_BODEGA_COLUMN_WIDTH,
                ]),
            ),
    );
    const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(columnKeys);
    const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(
        new Set(),
    );

    useEffect(() => {
        setColumnWidths((prev) => {
            const missing = columnKeys.filter((key) => !(key in prev));

            if (missing.length === 0) {
                return prev;
            }

            const next = { ...prev };
            missing.forEach((key) => {
                next[key] =
                    DEFAULT_COLUMN_WIDTHS[key] ?? DEFAULT_BODEGA_COLUMN_WIDTH;
            });

            return next;
        });

        setColumnOrder((prev) => {
            const prevSet = new Set(prev);
            const sameSet =
                prev.length === columnKeys.length &&
                columnKeys.every((key) => prevSet.has(key));

            // The visible key set changed (vista switch or bodega list
            // changed): rebuild the canonical order instead of appending,
            // so newly introduced columns land in their intended spot.
            return sameSet ? prev : columnKeys;
        });
    }, [columnKeys]);

    const [draggedKey, setDraggedKey] = useState<ColumnKey | null>(null);
    const [dragOverKey, setDragOverKey] = useState<ColumnKey | null>(null);
    const resizingKeyRef = useRef<ColumnKey | null>(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);
    const headerRefs = useRef<Map<ColumnKey, HTMLTableCellElement>>(new Map());
    const pendingFlipRef = useRef<Map<ColumnKey, DOMRect> | null>(null);

    const registerHeaderRef =
        (key: ColumnKey) => (element: HTMLTableCellElement | null) => {
            if (element) {
                headerRefs.current.set(key, element);
            } else {
                headerRefs.current.delete(key);
            }
        };

    /**
     * FLIP animation: capture every header cell's current position before
     * the reorder commits, then slide each one from its old spot to its new
     * one instead of snapping instantly, so the drag-drop reads as "this
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

    const startResize = (key: ColumnKey) => (event: React.MouseEvent) => {
        event.preventDefault();
        resizingKeyRef.current = key;
        resizeStartXRef.current = event.clientX;
        resizeStartWidthRef.current = columnWidths[key];
    };

    const handleColumnDragStart =
        (key: ColumnKey) => (event: React.DragEvent) => {
            setDraggedKey(key);
            event.dataTransfer.effectAllowed = 'move';
        };

    const handleColumnDragOver =
        (key: ColumnKey) => (event: React.DragEvent) => {
            event.preventDefault();

            if (dragOverKey !== key) {
                setDragOverKey(key);
            }
        };

    const handleColumnDrop = (key: ColumnKey) => (event: React.DragEvent) => {
        event.preventDefault();
        setDragOverKey(null);

        if (!draggedKey || draggedKey === key) {
            setDraggedKey(null);
            return;
        }

        const prevRects = new Map<ColumnKey, DOMRect>();
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

    const handleColumnDragEnd = () => {
        setDraggedKey(null);
        setDragOverKey(null);
    };

    const toggleColumnVisibility = (key: ColumnKey) => {
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
            }

            return next;
        });
    };

    // Self-healing merge: `columnOrder` is kept in sync with `columnKeys` by
    // an effect below, but that effect runs a render *after* `vista` (or the
    // bodega list) changes columnKeys. Deriving the rendered order straight
    // from columnOrder in that gap would include stale keys with no entry in
    // columnDefsMap and crash. Filtering/merging here instead keeps every
    // render consistent regardless of when the effect catches up.
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

    const toggleExpanded = (productoId: number) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);

            if (next.has(productoId)) {
                next.delete(productoId);
            } else {
                next.add(productoId);
            }

            return next;
        });
    };

    const handleSort = (key: ColumnKey) => {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const setFilter = (key: ColumnKey, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({});
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    const visibleRows = useMemo(() => {
        const term = search.trim().toLowerCase();
        const activeFilters = (
            Object.entries(filters) as [ColumnKey, string][]
        ).filter(([, value]) => value.trim() !== '');

        let list = rows.filter((row) => {
            if (term && !searchableText(row, bodegas).includes(term)) {
                return false;
            }

            return activeFilters.every(([key, value]) => {
                const cellValue = String(getSortValue(row, key))
                    .toLowerCase()
                    .trim();

                return cellValue.includes(value.toLowerCase().trim());
            });
        });

        if (sortKey) {
            list = [...list].sort((a, b) => {
                const valueA = getSortValue(a, sortKey);
                const valueB = getSortValue(b, sortKey);

                const comparison =
                    typeof valueA === 'number' && typeof valueB === 'number'
                        ? valueA - valueB
                        : String(valueA).localeCompare(String(valueB), 'es', {
                              sensitivity: 'base',
                          });

                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return list;
    }, [rows, bodegas, search, filters, sortKey, sortDirection]);

    const totalPages = Math.max(Math.ceil(visibleRows.length / pageSize), 1);
    const currentPage = Math.min(page, totalPages);

    const paginatedRows = useMemo(
        () =>
            visibleRows.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize,
            ),
        [visibleRows, currentPage],
    );

    useEffect(() => {
        setPage(1);
    }, [search, filters, sortKey, sortDirection]);

    const renderFilterHead = (meta: ColumnMeta): ReactNode => (
        <FilterCell
            key={meta.key}
            filterKey={meta.key}
            value={filters[meta.key] ?? ''}
            onChange={setFilter}
            align={meta.align}
        />
    );

    const renderBodyCell = (
        key: ColumnKey,
        row: ProductoStockRow,
    ): ReactNode => {
        switch (key) {
            case 'producto': {
                if (vista !== 'stock') {
                    return <TruncatedCell value={row.label} />;
                }

                const expanded = expandedRows.has(row.productoId);
                const Icon = expanded ? Minus : Plus;

                return (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => toggleExpanded(row.productoId)}
                            className="border-input hover:bg-accent flex size-5 shrink-0 items-center justify-center rounded border"
                            data-test="stock-bodega-expand-toggle"
                        >
                            <Icon className="size-3" />
                        </button>
                        <TruncatedCell value={row.label} />
                    </div>
                );
            }
            case 'stockTotal':
                return (
                    <div className="flex justify-end">
                        <ValueBadge value={totalStock(row)} />
                    </div>
                );
            case 'valorVenta':
                return (
                    <div className="flex justify-end">
                        <CurrencyBadge
                            value={valorVenta(row)}
                            colorClassName="bg-blue-100 text-blue-700 hover:bg-blue-100"
                        />
                    </div>
                );
            case 'valorMayor':
                return (
                    <div className="flex justify-end">
                        <CurrencyBadge
                            value={valorMayor(row)}
                            colorClassName="bg-purple-100 text-purple-700 hover:bg-purple-100"
                        />
                    </div>
                );
            case 'costo':
                return (
                    <div className="flex justify-end">
                        <CurrencyBadge
                            value={costoUnitario(row)}
                            colorClassName="bg-amber-100 text-amber-700 hover:bg-amber-100"
                        />
                    </div>
                );
            case 'total':
                return currencyFormatter.format(totalVenta(row));
            case 'totalCosto':
                return currencyFormatter.format(totalCosto(row));
            case 'valorUndInversion':
                return currencyFormatter.format(valorUndInversion(row));
            case 'valorTotalInversion':
                return currencyFormatter.format(valorTotalInversion(row));
            default: {
                const bodegaId = bodegaIdFromColumnKey(key);

                if (bodegaId === null) {
                    return null;
                }

                return (
                    <div className="flex justify-end">
                        <ValueBadge value={bodegaStock(row, bodegaId)} />
                    </div>
                );
            }
        }
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="relative max-w-sm flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar productos..."
                        className="pl-9"
                        data-test="stock-bodegas-search"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={vista}
                        onValueChange={(value) => {
                            if (value) {
                                setVista(value as Vista);
                            }
                        }}
                        data-test="stock-bodegas-vista-toggle"
                    >
                        <ToggleGroupItem
                            value="stock"
                            data-test="stock-bodegas-vista-stock"
                            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
                        >
                            Stock Bodegas
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="inversion"
                            data-test="stock-bodegas-vista-inversion"
                            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
                        >
                            Inversión
                        </ToggleGroupItem>
                    </ToggleGroup>

                    {activeFilterCount > 0 ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            data-test="stock-bodegas-clear-filters"
                            onClick={clearFilters}
                        >
                            <X className="size-4" />
                            Limpiar filtros
                        </Button>
                    ) : null}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-test="stock-bodegas-columns-toggle"
                            >
                                <Columns3 className="size-4" />
                                Columnas
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="max-h-80 overflow-y-auto"
                        >
                            <DropdownMenuLabel>
                                Mostrar columnas
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {columnDefs.map((meta) => (
                                <DropdownMenuCheckboxItem
                                    key={meta.key}
                                    checked={!hiddenColumns.has(meta.key)}
                                    onSelect={(event) => event.preventDefault()}
                                    onCheckedChange={() =>
                                        toggleColumnVisibility(meta.key)
                                    }
                                    data-test={`stock-bodegas-column-toggle-${meta.key}`}
                                >
                                    {meta.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="relative max-h-[75vh] w-full overflow-auto rounded-md border">
                <table className="w-full table-fixed caption-bottom text-sm [&_tr]:divide-x">
                    <colgroup>
                        {visibleColumnOrder.map((key) => (
                            <col
                                key={key}
                                style={{ width: columnWidths[key] }}
                            />
                        ))}
                    </colgroup>
                    <TableHeader className="bg-background sticky top-0 z-20 shadow-sm">
                        <TableRow>
                            {visibleColumnOrder.map((key) => {
                                const meta = columnDefsMap.get(key)!;

                                return (
                                    <HeaderCell
                                        key={key}
                                        meta={meta}
                                        activeSortKey={sortKey}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                        onResizeStart={startResize(key)}
                                        onDragStart={handleColumnDragStart(key)}
                                        onDragOver={handleColumnDragOver(key)}
                                        onDrop={handleColumnDrop(key)}
                                        onDragEnd={handleColumnDragEnd}
                                        isDragging={draggedKey === key}
                                        isDragOver={
                                            dragOverKey === key &&
                                            draggedKey !== key
                                        }
                                        cellRef={registerHeaderRef(key)}
                                    />
                                );
                            })}
                        </TableRow>
                        <TableRow>
                            {visibleColumnOrder.map((key) =>
                                renderFilterHead(columnDefsMap.get(key)!),
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRows.map((row) => {
                            const expanded =
                                vista === 'stock' &&
                                expandedRows.has(row.productoId);

                            return (
                                <Fragment key={row.productoId}>
                                    <TableRow data-test="stock-bodega-row">
                                        {visibleColumnOrder.map((key) => {
                                            const meta =
                                                columnDefsMap.get(key)!;

                                            return (
                                                <TableCell
                                                    key={key}
                                                    className={
                                                        meta.align === 'right'
                                                            ? 'text-right'
                                                            : undefined
                                                    }
                                                >
                                                    {renderBodyCell(key, row)}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                    {expanded ? (
                                        <TableRow data-test="stock-bodega-detail">
                                            <TableCell
                                                colSpan={
                                                    visibleColumnOrder.length
                                                }
                                                className="bg-muted/10 p-3"
                                            >
                                                <ExpandedDetail
                                                    row={row}
                                                    bodegas={bodegas}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                </Fragment>
                            );
                        })}
                    </TableBody>
                </table>
            </div>

            {visibleRows.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                    {rows.length === 0
                        ? 'No hay stock registrado.'
                        : 'Ningún producto coincide con la búsqueda.'}
                </p>
            ) : (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                        Mostrando {(currentPage - 1) * pageSize + 1}–
                        {Math.min(currentPage * pageSize, visibleRows.length)}{' '}
                        de {visibleRows.length} productos
                    </p>

                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        dataTest="stock-bodegas-page"
                    />
                </div>
            )}
        </div>
    );
}
