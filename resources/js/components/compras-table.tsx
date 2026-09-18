import { Link, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Columns3,
    GripVertical,
    Pencil,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import DateRangeFilter, {
    type DateRangeValue,
} from '@/components/date-range-filter';
import DeleteCompraModal from '@/components/delete-compra-modal';
import { Badge } from '@/components/ui/badge';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/compras';
import type { Compra, CompraPermissions } from '@/types';

type Props = {
    compras: Compra[];
    permissions: CompraPermissions;
};

type StaticColumnKey =
    | 'id'
    | 'factura'
    | 'fecha'
    | 'proveedor'
    | 'estado'
    | 'subtotal'
    | 'descuento'
    | 'total';

// Bodega columns are dynamic (one per warehouse seen in the data), so their
// keys are built as `bodega:<id>` and are not part of this static union.
type ColumnKey = StaticColumnKey | 'acciones' | string;

type FilterVariant = 'text' | 'estado' | 'date' | 'none';

type ColumnMeta = {
    key: ColumnKey;
    label: string;
    align?: 'right';
    sortable: boolean;
    filter: FilterVariant;
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

const STATIC_COLUMN_DEFS: ColumnMeta[] = [
    { key: 'id', label: 'ID', sortable: true, filter: 'text' },
    { key: 'factura', label: 'Factura', sortable: true, filter: 'text' },
    { key: 'fecha', label: 'Fecha', sortable: true, filter: 'date' },
    { key: 'proveedor', label: 'Proveedor', sortable: true, filter: 'text' },
    { key: 'estado', label: 'Estado', sortable: true, filter: 'estado' },
    {
        key: 'subtotal',
        label: 'Subtotal',
        sortable: true,
        filter: 'text',
        align: 'right',
    },
    {
        key: 'descuento',
        label: 'Descuento',
        sortable: true,
        filter: 'text',
        align: 'right',
    },
    {
        key: 'total',
        label: 'Total a pagar',
        sortable: true,
        filter: 'text',
        align: 'right',
    },
];

const ACCIONES_COLUMN: ColumnMeta = {
    key: 'acciones',
    label: 'Acciones',
    sortable: false,
    filter: 'none',
    align: 'right',
};

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
    id: 70,
    factura: 130,
    fecha: 150,
    proveedor: 180,
    estado: 120,
    subtotal: 130,
    descuento: 120,
    total: 140,
    acciones: 100,
};

const DEFAULT_BODEGA_COLUMN_WIDTH = 220;
const MIN_COLUMN_WIDTH = 60;

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

function productosPorBodega(compra: Compra, bodegaId: number): string[] {
    return (compra.detalles_compra ?? [])
        .filter((detalle) => detalle.bodega_id === bodegaId)
        .map(
            (detalle) =>
                detalle.producto?.concatenar_codigo_nombre ??
                detalle.producto?.referencia_producto ??
                `Producto ${detalle.producto_id}`,
        );
}

function todosLosProductos(compra: Compra): string[] {
    return (compra.detalles_compra ?? []).map(
        (detalle) =>
            detalle.producto?.concatenar_codigo_nombre ??
            detalle.producto?.referencia_producto ??
            `Producto ${detalle.producto_id}`,
    );
}

function getSortValue(compra: Compra, key: ColumnKey): string | number {
    switch (key) {
        case 'id':
            return compra.id;
        case 'factura':
            return compra.factura ?? '';
        case 'fecha':
            return compra.fecha ? new Date(compra.fecha).getTime() : 0;
        case 'proveedor':
            return compra.proveedor?.nombre_proveedor ?? '';
        case 'estado':
            return compra.estado;
        case 'subtotal':
            return Number(compra.subtotal);
        case 'descuento':
            return Number(compra.descuento);
        case 'total':
            return Number(compra.total_a_pagar);
        default: {
            const bodegaId = bodegaIdFromColumnKey(key);

            return bodegaId !== null
                ? productosPorBodega(compra, bodegaId).join(', ')
                : '';
        }
    }
}

function searchableText(compra: Compra): string {
    return [
        compra.id,
        compra.factura,
        compra.proveedor?.nombre_proveedor,
        compra.estado,
        compra.subtotal,
        compra.descuento,
        compra.total_a_pagar,
        todosLosProductos(compra).join(' '),
    ]
        .filter(Boolean)
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

function ListCell({ items }: { items: string[] }) {
    if (items.length === 0) {
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <ul className="list-disc space-y-0.5 py-1 pl-4">
            {items.map((item, index) => (
                <li key={index} className="truncate" title={item}>
                    {item}
                </li>
            ))}
        </ul>
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

const ESTADO_OPTIONS = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'RECIBIDA', label: 'Recibida' },
];

type FilterCellProps = {
    filterKey: ColumnKey;
    value: string;
    onChange: (key: ColumnKey, value: string) => void;
    variant?: 'text' | 'estado';
    align?: 'left' | 'right';
};

function FilterCell({
    filterKey,
    value,
    onChange,
    variant = 'text',
    align = 'left',
}: FilterCellProps) {
    if (variant === 'estado') {
        return (
            <TableHead
                className={align === 'right' ? 'text-right' : undefined}
            >
                <Select
                    value={value === '' ? 'ALL' : value}
                    onValueChange={(next) =>
                        onChange(filterKey, next === 'ALL' ? '' : next)
                    }
                >
                    <SelectTrigger
                        size="sm"
                        className="h-8 w-full text-xs"
                        data-test={`compras-filter-${filterKey}`}
                    >
                        <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        {ESTADO_OPTIONS.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableHead>
        );
    }

    return (
        <TableHead className={align === 'right' ? 'text-right' : undefined}>
            <Input
                value={value}
                onChange={(event) => onChange(filterKey, event.target.value)}
                placeholder="Filtrar..."
                className="h-8 text-xs"
                data-test={`compras-filter-${filterKey}`}
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
                    <span className="text-muted-foreground">
                        {meta.label}
                    </span>
                )}
            </div>
            <ResizeHandle onMouseDown={onResizeStart} />
        </TableHead>
    );
}

export default function ComprasTable({ compras, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [compraToDelete, setCompraToDelete] = useState<Compra | null>(null);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<ColumnKey | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState<Partial<Record<ColumnKey, string>>>(
        {},
    );
    const [dateRange, setDateRange] = useState<DateRangeValue>({
        from: '',
        to: '',
    });
    const [page, setPage] = useState(1);
    const pageSize = 25;

    const bodegas = useMemo(() => {
        const map = new Map<number, string>();

        compras.forEach((compra) => {
            (compra.detalles_compra ?? []).forEach((detalle) => {
                if (!map.has(detalle.bodega_id)) {
                    map.set(
                        detalle.bodega_id,
                        detalle.bodega?.nombre_bodega ??
                            `Bodega ${detalle.bodega_id}`,
                    );
                }
            });
        });

        return Array.from(map.entries())
            .map(([id, nombre]) => ({ id, nombre }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }, [compras]);

    const columnDefs = useMemo<ColumnMeta[]>(
        () => [
            ...STATIC_COLUMN_DEFS,
            ...bodegas.map(
                (bodega): ColumnMeta => ({
                    key: bodegaColumnKey(bodega.id),
                    label: bodega.nombre,
                    sortable: true,
                    filter: 'text',
                }),
            ),
            ACCIONES_COLUMN,
        ],
        [bodegas],
    );

    const columnDefsMap = useMemo(
        () => new Map(columnDefs.map((meta) => [meta.key, meta])),
        [columnDefs],
    );
    const columnKeys = useMemo(
        () => columnDefs.map((meta) => meta.key),
        [columnDefs],
    );
    const hideableColumns = useMemo(
        () => columnDefs.filter((meta) => meta.key !== 'acciones'),
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
            const known = new Set(columnKeys);
            const next = prev.filter((key) => known.has(key));

            columnKeys.forEach((key) => {
                if (!next.includes(key)) {
                    next.push(key);
                }
            });

            return next;
        });
    }, [columnKeys]);

    const [draggedKey, setDraggedKey] = useState<ColumnKey | null>(null);
    const [dragOverKey, setDragOverKey] = useState<ColumnKey | null>(null);
    const resizingKeyRef = useRef<ColumnKey | null>(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);
    const headerRefs = useRef<Map<ColumnKey, HTMLTableCellElement>>(
        new Map(),
    );
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

                if (key === 'fecha') {
                    setDateRange({ from: '', to: '' });
                } else {
                    setFilters((filtersPrev) => {
                        const { [key]: _removed, ...rest } = filtersPrev;

                        return rest;
                    });
                }
            }

            return next;
        });
    };

    const visibleColumnOrder = useMemo(
        () => columnOrder.filter((key) => !hiddenColumns.has(key)),
        [columnOrder, hiddenColumns],
    );

    const openDeleteDialog = (compra: Compra) => {
        setCompraToDelete(compra);
        setDeleteDialogOpen(true);
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
        setDateRange({ from: '', to: '' });
    };

    const activeFilterCount =
        Object.values(filters).filter(Boolean).length +
        (dateRange.from || dateRange.to ? 1 : 0);

    const visibleCompras = useMemo(() => {
        const term = search.trim().toLowerCase();
        const activeFilters = (
            Object.entries(filters) as [ColumnKey, string][]
        ).filter(([key, value]) => key !== 'fecha' && value.trim() !== '');

        const fromTime = dateRange.from
            ? new Date(`${dateRange.from}T00:00:00`).getTime()
            : null;
        const toTime = dateRange.to
            ? new Date(`${dateRange.to}T23:59:59.999`).getTime()
            : null;

        let list = compras.filter((compra) => {
            if (term && !searchableText(compra).includes(term)) {
                return false;
            }

            if (fromTime !== null || toTime !== null) {
                const fechaTime = compra.fecha
                    ? new Date(compra.fecha).getTime()
                    : null;

                if (fechaTime === null) {
                    return false;
                }

                if (fromTime !== null && fechaTime < fromTime) {
                    return false;
                }

                if (toTime !== null && fechaTime > toTime) {
                    return false;
                }
            }

            return activeFilters.every(([key, value]) => {
                const cellValue = String(getSortValue(compra, key))
                    .toLowerCase()
                    .trim();

                if (key === 'estado') {
                    return cellValue === value.toLowerCase();
                }

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
    }, [compras, search, filters, dateRange, sortKey, sortDirection]);

    const totalPages = Math.max(
        Math.ceil(visibleCompras.length / pageSize),
        1,
    );
    const currentPage = Math.min(page, totalPages);

    const paginatedCompras = useMemo(
        () =>
            visibleCompras.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize,
            ),
        [visibleCompras, currentPage],
    );

    useEffect(() => {
        setPage(1);
    }, [search, filters, dateRange, sortKey, sortDirection]);

    const renderFilterHead = (meta: ColumnMeta): ReactNode => {
        switch (meta.filter) {
            case 'text':
                return (
                    <FilterCell
                        key={meta.key}
                        filterKey={meta.key}
                        value={filters[meta.key] ?? ''}
                        onChange={setFilter}
                        align={meta.align}
                    />
                );
            case 'estado':
                return (
                    <FilterCell
                        key={meta.key}
                        filterKey={meta.key}
                        value={filters[meta.key] ?? ''}
                        onChange={setFilter}
                        variant="estado"
                    />
                );
            case 'date':
                return (
                    <TableHead key={meta.key}>
                        <DateRangeFilter
                            value={dateRange}
                            onChange={setDateRange}
                            title="Filtrar por fecha"
                            dataTest="compras-filter-fecha"
                        />
                    </TableHead>
                );
            case 'none':
                return (
                    <TableHead key={meta.key} className="text-right">
                        {activeFilterCount > 0 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                data-test="compras-clear-filters"
                                onClick={clearFilters}
                            >
                                <X className="size-4" />
                                Limpiar
                            </Button>
                        ) : null}
                    </TableHead>
                );
        }
    };

    const renderBodyCell = (key: ColumnKey, compra: Compra): ReactNode => {
        switch (key) {
            case 'id':
                return compra.id;
            case 'factura':
                return <TruncatedCell value={compra.factura ?? '—'} />;
            case 'fecha':
                return compra.fecha
                    ? new Date(compra.fecha).toLocaleDateString('es-CO')
                    : '—';
            case 'proveedor':
                return (
                    <TruncatedCell
                        value={compra.proveedor?.nombre_proveedor ?? '—'}
                    />
                );
            case 'estado':
                return (
                    <Badge
                        className={cn(
                            'border-transparent',
                            compra.estado === 'RECIBIDA'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                        )}
                    >
                        {compra.estado}
                    </Badge>
                );
            case 'subtotal':
                return currencyFormatter.format(Number(compra.subtotal));
            case 'descuento':
                return currencyFormatter.format(Number(compra.descuento));
            case 'total':
                return currencyFormatter.format(Number(compra.total_a_pagar));
            case 'acciones':
                return (
                    <TooltipProvider>
                        <div className="flex justify-end gap-2">
                            {permissions.canUpdate ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="edit-compra-button"
                                            asChild
                                        >
                                            <Link
                                                href={edit([
                                                    teamSlug,
                                                    compra.id,
                                                ])}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Editar</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}

                            {permissions.canDelete ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="delete-compra-button"
                                            onClick={() =>
                                                openDeleteDialog(compra)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Eliminar</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}
                        </div>
                    </TooltipProvider>
                );
            default: {
                const bodegaId = bodegaIdFromColumnKey(key);

                return bodegaId !== null ? (
                    <ListCell items={productosPorBodega(compra, bodegaId)} />
                ) : null;
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
                        placeholder="Buscar compras..."
                        className="pl-9"
                        data-test="compras-search"
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-test="compras-columns-toggle"
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
                        {hideableColumns.map((meta) => (
                            <DropdownMenuCheckboxItem
                                key={meta.key}
                                checked={!hiddenColumns.has(meta.key)}
                                onSelect={(event) => event.preventDefault()}
                                onCheckedChange={() =>
                                    toggleColumnVisibility(meta.key)
                                }
                                data-test={`compras-column-toggle-${meta.key}`}
                            >
                                {meta.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
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
                                        onDragStart={handleColumnDragStart(
                                            key,
                                        )}
                                        onDragOver={handleColumnDragOver(
                                            key,
                                        )}
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
                        {paginatedCompras.map((compra) => (
                            <TableRow key={compra.id} data-test="compra-row">
                                {visibleColumnOrder.map((key) => {
                                    const meta = columnDefsMap.get(key)!;

                                    return (
                                        <TableCell
                                            key={key}
                                            className={
                                                meta.align === 'right'
                                                    ? 'text-right'
                                                    : undefined
                                            }
                                        >
                                            {renderBodyCell(key, compra)}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </table>
            </div>

            {visibleCompras.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                    {compras.length === 0
                        ? 'No hay compras registradas.'
                        : 'Ninguna compra coincide con la búsqueda.'}
                </p>
            ) : (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                        Mostrando {(currentPage - 1) * pageSize + 1}–
                        {Math.min(
                            currentPage * pageSize,
                            visibleCompras.length,
                        )}{' '}
                        de {visibleCompras.length} compras
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-test="compras-page-prev"
                            disabled={currentPage <= 1}
                            onClick={() =>
                                setPage((prev) => Math.max(prev - 1, 1))
                            }
                        >
                            <ChevronLeft className="size-4" />
                            Anterior
                        </Button>
                        <span className="text-muted-foreground px-2">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-test="compras-page-next"
                            disabled={currentPage >= totalPages}
                            onClick={() =>
                                setPage((prev) =>
                                    Math.min(prev + 1, totalPages),
                                )
                            }
                        >
                            Siguiente
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            <DeleteCompraModal
                teamSlug={teamSlug}
                compra={compraToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </div>
    );
}
