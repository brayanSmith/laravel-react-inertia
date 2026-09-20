import { Link, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
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
import DeletePedidoModal from '@/components/delete-pedido-modal';
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
import type { Pedido, PedidoPermissions, PedidoRoutes } from '@/types';

type Props = {
    pedidos: Pedido[];
    permissions: PedidoPermissions;
    routes: PedidoRoutes;
};

type SortKey =
    | 'id'
    | 'bodega'
    | 'cliente'
    | 'nit'
    | 'fecha'
    | 'estado'
    | 'ajuste'
    | 'total'
    | 'saldo'
    | 'vendedor'
    | 'turno'
    | 'productos'
    | 'medios'
    | 'observacion_pago'
    | 'observacion'
    | 'estado_pago';

type SortDirection = 'asc' | 'desc';

type ColumnKey = SortKey | 'acciones';

type FilterVariant = 'text' | 'estado' | 'estado_pago' | 'date' | 'none';

type ColumnMeta = {
    key: ColumnKey;
    label: string;
    align?: 'right';
    sortable: boolean;
    filter: FilterVariant;
};

const COLUMN_DEFS: ColumnMeta[] = [
    { key: 'id', label: 'ID', sortable: true, filter: 'text' },
    { key: 'bodega', label: 'Bodega', sortable: true, filter: 'text' },
    { key: 'cliente', label: 'Cliente', sortable: true, filter: 'text' },
    { key: 'nit', label: 'NIT', sortable: true, filter: 'text' },
    { key: 'fecha', label: 'Fecha', sortable: true, filter: 'date' },
    { key: 'estado', label: 'Estado', sortable: true, filter: 'estado' },
    {
        key: 'ajuste',
        label: 'Ajuste',
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
    {
        key: 'saldo',
        label: 'Saldo',
        sortable: true,
        filter: 'text',
        align: 'right',
    },
    { key: 'vendedor', label: 'Vendedor', sortable: true, filter: 'text' },
    { key: 'turno', label: 'Turno', sortable: true, filter: 'text' },
    { key: 'productos', label: 'Productos', sortable: true, filter: 'text' },
    {
        key: 'medios',
        label: 'Medios de pago',
        sortable: true,
        filter: 'text',
    },
    {
        key: 'observacion_pago',
        label: 'Observación pago',
        sortable: true,
        filter: 'text',
    },
    {
        key: 'observacion',
        label: 'Observación',
        sortable: true,
        filter: 'text',
    },
    {
        key: 'estado_pago',
        label: 'Estado pago',
        sortable: true,
        filter: 'estado_pago',
    },
    {
        key: 'acciones',
        label: 'Acciones',
        sortable: false,
        filter: 'none',
        align: 'right',
    },
];

const COLUMN_DEFS_MAP = new Map(COLUMN_DEFS.map((meta) => [meta.key, meta]));
const COLUMN_KEYS: ColumnKey[] = COLUMN_DEFS.map((meta) => meta.key);
const HIDEABLE_COLUMNS = COLUMN_DEFS.filter((meta) => meta.key !== 'acciones');

const DEFAULT_COLUMN_WIDTHS: Record<ColumnKey, number> = {
    id: 70,
    bodega: 130,
    cliente: 170,
    nit: 110,
    fecha: 150,
    estado: 120,
    ajuste: 100,
    total: 130,
    saldo: 110,
    vendedor: 140,
    turno: 90,
    productos: 220,
    medios: 200,
    observacion_pago: 180,
    observacion: 180,
    estado_pago: 120,
    acciones: 100,
};

const MIN_COLUMN_WIDTH = 60;

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

function ajusteTotal(pedido: Pedido): number {
    return (
        Number(pedido.descuento ?? 0) +
        Number(pedido.reteica ?? 0) +
        Number(pedido.retefuente ?? 0)
    );
}

function productosList(pedido: Pedido): string[] {
    return (pedido.detalles ?? []).map(
        (detalle) =>
            detalle.producto?.concatenar_codigo_nombre ??
            detalle.producto?.referencia_producto ??
            `Producto ${detalle.producto_id}`,
    );
}

function productosResumen(pedido: Pedido): string {
    const nombres = productosList(pedido);

    return nombres.length > 0 ? nombres.join(', ') : '—';
}

function mediosDePagoResumen(pedido: Pedido): string {
    const nombres = Array.from(
        new Set(
            (pedido.abonos ?? [])
                .map((abono) => abono.puc?.concatenar_subcuenta_concepto)
                .filter((nombre): nombre is string => Boolean(nombre)),
        ),
    );

    return nombres.length > 0 ? nombres.join(', ') : '—';
}

function getSortValue(pedido: Pedido, key: SortKey): string | number {
    switch (key) {
        case 'id':
            return pedido.id;
        case 'bodega':
            return pedido.bodega?.nombre_bodega ?? '';
        case 'cliente':
            return pedido.cliente?.razon_social ?? '';
        case 'nit':
            return pedido.cliente?.numero_documento ?? '';
        case 'fecha':
            return pedido.fecha ? new Date(pedido.fecha).getTime() : 0;
        case 'estado':
            return pedido.estado;
        case 'ajuste':
            return ajusteTotal(pedido);
        case 'total':
            return Number(pedido.total_a_pagar);
        case 'saldo':
            return Number(pedido.saldo_pendiente);
        case 'vendedor':
            return pedido.user?.name ?? '';
        case 'turno':
            return pedido.turno ?? '';
        case 'productos':
            return productosResumen(pedido);
        case 'medios':
            return mediosDePagoResumen(pedido);
        case 'observacion_pago':
            return pedido.observacion_pago ?? '';
        case 'observacion':
            return pedido.observacion ?? '';
        case 'estado_pago':
            return pedido.estado_pago;
        default:
            return '';
    }
}

function searchableText(pedido: Pedido): string {
    return [
        pedido.id,
        pedido.bodega?.nombre_bodega,
        pedido.cliente?.razon_social,
        pedido.cliente?.numero_documento,
        pedido.estado,
        pedido.estado_pago,
        pedido.user?.name,
        pedido.turno,
        productosResumen(pedido),
        mediosDePagoResumen(pedido),
        pedido.observacion_pago,
        pedido.observacion,
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
    { value: 'COMPLETADO', label: 'Completado' },
];

const ESTADO_PAGO_OPTIONS = [
    { value: 'EN_CARTERA', label: 'En cartera' },
    { value: 'SALDADO', label: 'Saldado' },
    { value: 'NO_APLICA', label: 'No aplica' },
];

type FilterCellProps = {
    filterKey: SortKey;
    value: string;
    onChange: (key: SortKey, value: string) => void;
    variant?: 'text' | 'estado' | 'estado_pago';
    align?: 'left' | 'right';
};

function FilterCell({
    filterKey,
    value,
    onChange,
    variant = 'text',
    align = 'left',
}: FilterCellProps) {
    if (variant === 'estado' || variant === 'estado_pago') {
        const options =
            variant === 'estado' ? ESTADO_OPTIONS : ESTADO_PAGO_OPTIONS;

        return (
            <TableHead className={align === 'right' ? 'text-right' : undefined}>
                <Select
                    value={value === '' ? 'ALL' : value}
                    onValueChange={(next) =>
                        onChange(filterKey, next === 'ALL' ? '' : next)
                    }
                >
                    <SelectTrigger
                        size="sm"
                        className="h-8 w-full text-xs"
                        data-test={`pedidos-filter-${filterKey}`}
                    >
                        <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
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
                data-test={`pedidos-filter-${filterKey}`}
            />
        </TableHead>
    );
}

type HeaderCellProps = {
    meta: ColumnMeta;
    activeSortKey: SortKey | null;
    sortDirection: SortDirection;
    onSort: (key: SortKey) => void;
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
                        onClick={() => onSort(meta.key as SortKey)}
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

export default function PedidosTable({ pedidos, permissions, routes }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pedidoToDelete, setPedidoToDelete] = useState<Pedido | null>(null);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [filters, setFilters] = useState<Partial<Record<SortKey, string>>>(
        {},
    );
    const [dateRange, setDateRange] = useState<DateRangeValue>({
        from: '',
        to: '',
    });
    const [page, setPage] = useState(1);
    const pageSize = 25;
    const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(
        DEFAULT_COLUMN_WIDTHS,
    );
    const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(COLUMN_KEYS);
    const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(
        new Set(),
    );
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
     * the reorder commits, then (in the layout effect below) slide each one
     * from its old spot to its new one instead of snapping instantly, so
     * the drag-drop reads as "this column moved" rather than a hard jump.
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

            // Force layout so the browser registers the offset above
            // before we animate it away.
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
                        const { [key as SortKey]: _removed, ...rest } =
                            filtersPrev;

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

    const openDeleteDialog = (pedido: Pedido) => {
        setPedidoToDelete(pedido);
        setDeleteDialogOpen(true);
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const setFilter = (key: SortKey, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({});
        setDateRange({ from: '', to: '' });
    };

    const activeFilterCount =
        Object.values(filters).filter(Boolean).length +
        (dateRange.from || dateRange.to ? 1 : 0);

    const visiblePedidos = useMemo(() => {
        const term = search.trim().toLowerCase();
        const activeFilters = (
            Object.entries(filters) as [SortKey, string][]
        ).filter(([key, value]) => key !== 'fecha' && value.trim() !== '');

        const fromTime = dateRange.from
            ? new Date(`${dateRange.from}T00:00:00`).getTime()
            : null;
        const toTime = dateRange.to
            ? new Date(`${dateRange.to}T23:59:59.999`).getTime()
            : null;

        let list = pedidos.filter((pedido) => {
            if (term && !searchableText(pedido).includes(term)) {
                return false;
            }

            if (fromTime !== null || toTime !== null) {
                const fechaTime = pedido.fecha
                    ? new Date(pedido.fecha).getTime()
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
                const cellValue = String(getSortValue(pedido, key))
                    .toLowerCase()
                    .trim();

                if (key === 'estado' || key === 'estado_pago') {
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
    }, [pedidos, search, filters, dateRange, sortKey, sortDirection]);

    const totalPages = Math.max(Math.ceil(visiblePedidos.length / pageSize), 1);
    const currentPage = Math.min(page, totalPages);

    const paginatedPedidos = useMemo(
        () =>
            visiblePedidos.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize,
            ),
        [visiblePedidos, currentPage],
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
                        filterKey={meta.key as SortKey}
                        value={filters[meta.key as SortKey] ?? ''}
                        onChange={setFilter}
                        align={meta.align}
                    />
                );
            case 'estado':
            case 'estado_pago':
                return (
                    <FilterCell
                        key={meta.key}
                        filterKey={meta.key as SortKey}
                        value={filters[meta.key as SortKey] ?? ''}
                        onChange={setFilter}
                        variant={meta.filter}
                    />
                );
            case 'date':
                return (
                    <TableHead key={meta.key}>
                        <DateRangeFilter
                            value={dateRange}
                            onChange={setDateRange}
                            title="Filtrar por fecha"
                            dataTest="pedidos-filter-fecha"
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
                                data-test="pedidos-clear-filters"
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

    const renderBodyCell = (key: ColumnKey, pedido: Pedido): ReactNode => {
        switch (key) {
            case 'id':
                return pedido.id;
            case 'bodega':
                return (
                    <TruncatedCell
                        value={pedido.bodega?.nombre_bodega ?? '—'}
                    />
                );
            case 'cliente':
                return (
                    <TruncatedCell
                        value={pedido.cliente?.razon_social ?? '—'}
                    />
                );
            case 'nit':
                return (
                    <TruncatedCell
                        value={pedido.cliente?.numero_documento ?? '—'}
                    />
                );
            case 'fecha':
                return pedido.fecha
                    ? new Date(pedido.fecha).toLocaleDateString('es-CO')
                    : '—';
            case 'estado':
                return (
                    <Badge
                        className={cn(
                            'border-transparent',
                            pedido.estado === 'COMPLETADO'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                        )}
                    >
                        {pedido.estado}
                    </Badge>
                );
            case 'ajuste':
                return currencyFormatter.format(ajusteTotal(pedido));
            case 'total':
                return currencyFormatter.format(Number(pedido.total_a_pagar));
            case 'saldo':
                return currencyFormatter.format(Number(pedido.saldo_pendiente));
            case 'vendedor':
                return <TruncatedCell value={pedido.user?.name ?? '—'} />;
            case 'turno':
                return <TruncatedCell value={pedido.turno ?? '—'} />;
            case 'productos':
                return <ListCell items={productosList(pedido)} />;
            case 'medios':
                return <TruncatedCell value={mediosDePagoResumen(pedido)} />;
            case 'observacion_pago':
                return <TruncatedCell value={pedido.observacion_pago ?? '—'} />;
            case 'observacion':
                return <TruncatedCell value={pedido.observacion ?? '—'} />;
            case 'estado_pago':
                return (
                    <Badge
                        className={cn(
                            'border-transparent',
                            pedido.estado_pago === 'SALDADO'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                        )}
                    >
                        {pedido.estado_pago}
                    </Badge>
                );
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
                                            data-test="edit-pedido-button"
                                            asChild
                                        >
                                            <Link
                                                href={routes.pedidos.edit([
                                                    teamSlug,
                                                    pedido.id,
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
                                            data-test="delete-pedido-button"
                                            onClick={() =>
                                                openDeleteDialog(pedido)
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
            default:
                return null;
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
                        placeholder="Buscar pedidos..."
                        className="pl-9"
                        data-test="pedidos-search"
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-test="pedidos-columns-toggle"
                        >
                            <Columns3 className="size-4" />
                            Columnas
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="max-h-80 overflow-y-auto"
                    >
                        <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {HIDEABLE_COLUMNS.map((meta) => (
                            <DropdownMenuCheckboxItem
                                key={meta.key}
                                checked={!hiddenColumns.has(meta.key)}
                                onSelect={(event) => event.preventDefault()}
                                onCheckedChange={() =>
                                    toggleColumnVisibility(meta.key)
                                }
                                data-test={`pedidos-column-toggle-${meta.key}`}
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
                                const meta = COLUMN_DEFS_MAP.get(key)!;

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
                                renderFilterHead(COLUMN_DEFS_MAP.get(key)!),
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedPedidos.map((pedido) => (
                            <TableRow key={pedido.id} data-test="pedido-row">
                                {visibleColumnOrder.map((key) => {
                                    const meta = COLUMN_DEFS_MAP.get(key)!;

                                    return (
                                        <TableCell
                                            key={key}
                                            className={
                                                meta.align === 'right'
                                                    ? 'text-right'
                                                    : undefined
                                            }
                                        >
                                            {renderBodyCell(key, pedido)}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </table>
            </div>

            {visiblePedidos.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                    {pedidos.length === 0
                        ? 'No hay pedidos registrados.'
                        : 'Ningún pedido coincide con la búsqueda.'}
                </p>
            ) : (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                        Mostrando {(currentPage - 1) * pageSize + 1}–
                        {Math.min(
                            currentPage * pageSize,
                            visiblePedidos.length,
                        )}{' '}
                        de {visiblePedidos.length} pedidos
                    </p>

                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        dataTest="pedidos-page"
                    />
                </div>
            )}

            <DeletePedidoModal
                teamSlug={teamSlug}
                pedido={pedidoToDelete}
                routes={routes}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </div>
    );
}
