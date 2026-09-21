import { Link, usePage } from '@inertiajs/react';
import { useTiposPrecio } from '@/hooks/use-tipos-precio';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Columns3,
    GripVertical,
    Search,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import DateRangeFilter, {
    type DateRangeValue,
} from '@/components/date-range-filter';
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
import { cn } from '@/lib/utils';
import type { Pedido, PedidoDetalle, PedidoRoutes } from '@/types';

type Props = {
    pedidos: Pedido[];
    routes: PedidoRoutes;
    /** Showing the deleted pedidos: their edit page is not available. */
    eliminados?: boolean;
};

type ColumnKey =
    | 'id'
    | 'bodega'
    | 'codigoPedido'
    | 'stockTotal'
    | 'tipoVehiculo'
    | 'producto'
    | 'fecha'
    | 'cantidad'
    | 'precioUnitario'
    | 'costoUnitario'
    | 'costoTotal'
    | 'gananciaTotal'
    | 'subtotal'
    | 'cliente'
    | 'usuario';

type SortDirection = 'asc' | 'desc';

type FilterVariant = 'text' | 'tipoVehiculo' | 'date';

type ColumnMeta = {
    key: ColumnKey;
    label: string;
    align?: 'right' | 'center';
    filter: FilterVariant;
};

const COLUMN_DEFS: ColumnMeta[] = [
    { key: 'id', label: 'Detalle pedido', filter: 'text' },
    { key: 'bodega', label: 'Bodega', filter: 'text' },
    { key: 'codigoPedido', label: 'Código Pedido', filter: 'text' },
    { key: 'stockTotal', label: 'Stock total', filter: 'text', align: 'right' },
    { key: 'tipoVehiculo', label: 'Tipo Vehículo', filter: 'tipoVehiculo' },
    { key: 'producto', label: 'Producto', filter: 'text' },
    { key: 'fecha', label: 'Fecha', filter: 'date' },
    { key: 'cantidad', label: 'Cantidad', filter: 'text', align: 'center' },
    {
        key: 'precioUnitario',
        label: 'Precio Unitario',
        filter: 'text',
        align: 'right',
    },
    {
        key: 'costoUnitario',
        label: 'Costo Unitario',
        filter: 'text',
        align: 'right',
    },
    {
        key: 'costoTotal',
        label: 'Costo Total',
        filter: 'text',
        align: 'right',
    },
    {
        key: 'gananciaTotal',
        label: 'Ganancia Total',
        filter: 'text',
        align: 'right',
    },
    { key: 'subtotal', label: 'Sub Total', filter: 'text', align: 'right' },
    { key: 'cliente', label: 'Cliente', filter: 'text' },
    { key: 'usuario', label: 'Usuario', filter: 'text' },
];

/** Columns that only make sense for whoever may see the costo. */
const COSTO_COLUMNS: ColumnKey[] = [
    'costoUnitario',
    'costoTotal',
    'gananciaTotal',
];

const COLUMN_DEFS_MAP = new Map(COLUMN_DEFS.map((meta) => [meta.key, meta]));
const COLUMN_KEYS: ColumnKey[] = COLUMN_DEFS.map((meta) => meta.key);

const DEFAULT_COLUMN_WIDTHS: Record<ColumnKey, number> = {
    id: 120,
    bodega: 130,
    codigoPedido: 130,
    stockTotal: 110,
    tipoVehiculo: 130,
    producto: 220,
    fecha: 150,
    cantidad: 100,
    precioUnitario: 140,
    costoUnitario: 140,
    costoTotal: 130,
    gananciaTotal: 140,
    subtotal: 130,
    cliente: 170,
    usuario: 140,
};

const MIN_COLUMN_WIDTH = 60;

const TIPO_VEHICULO_OPTIONS = [
    { value: 'CARRO', label: 'Carro' },
    { value: 'MOTO', label: 'Moto' },
];

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

type DetalleRow = {
    id: number;
    pedidoId: number;
    bodega: string;
    stockTotal: number;
    tipoVehiculo: string;
    producto: string;
    fecha: string | null;
    cantidad: number;
    precioUnitario: number;
    costoUnitario: number;
    costoTotal: number;
    gananciaTotal: number;
    subtotal: number;
    cliente: string;
    usuario: string;
};

function productoLabelFor(detalle: PedidoDetalle): string {
    return (
        detalle.producto?.concatenar_codigo_nombre ??
        detalle.producto?.referencia_producto ??
        `Producto ${detalle.producto_id}`
    );
}

function stockTotalFor(detalle: PedidoDetalle): number {
    return Number(detalle.producto?.stock_total ?? 0);
}

function getSortValue(row: DetalleRow, key: ColumnKey): string | number {
    switch (key) {
        case 'id':
            return row.id;
        case 'bodega':
            return row.bodega;
        case 'codigoPedido':
            return row.pedidoId;
        case 'stockTotal':
            return row.stockTotal;
        case 'tipoVehiculo':
            return row.tipoVehiculo;
        case 'producto':
            return row.producto;
        case 'fecha':
            return row.fecha ? new Date(row.fecha).getTime() : 0;
        case 'cantidad':
            return row.cantidad;
        case 'precioUnitario':
            return row.precioUnitario;
        case 'costoUnitario':
            return row.costoUnitario;
        case 'costoTotal':
            return row.costoTotal;
        case 'gananciaTotal':
            return row.gananciaTotal;
        case 'subtotal':
            return row.subtotal;
        case 'cliente':
            return row.cliente;
        case 'usuario':
            return row.usuario;
        default:
            return '';
    }
}

function searchableText(row: DetalleRow): string {
    return [
        row.id,
        row.bodega,
        row.pedidoId,
        row.tipoVehiculo,
        row.producto,
        row.cliente,
        row.usuario,
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
    variant?: 'text' | 'tipoVehiculo';
    align?: 'right' | 'center';
};

function FilterCell({
    filterKey,
    value,
    onChange,
    variant = 'text',
    align,
}: FilterCellProps) {
    const alignClass =
        align === 'right'
            ? 'text-right'
            : align === 'center'
              ? 'text-center'
              : undefined;

    if (variant === 'tipoVehiculo') {
        return (
            <TableHead className={alignClass}>
                <Select
                    value={value === '' ? 'ALL' : value}
                    onValueChange={(next) =>
                        onChange(filterKey, next === 'ALL' ? '' : next)
                    }
                >
                    <SelectTrigger
                        size="sm"
                        className="h-8 w-full text-xs"
                        data-test={`detalle-pedidos-filter-${filterKey}`}
                    >
                        <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        {TIPO_VEHICULO_OPTIONS.map((option) => (
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
        <TableHead className={alignClass}>
            <Input
                value={value}
                onChange={(event) => onChange(filterKey, event.target.value)}
                placeholder="Filtrar..."
                className="h-8 text-xs"
                data-test={`detalle-pedidos-filter-${filterKey}`}
            />
        </TableHead>
    );
}

type HeaderCellProps = {
    meta: ColumnMeta;
    activeSortKey: ColumnKey | null;
    sortDirection: SortDirection;
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
    const isActive = activeSortKey === meta.key;
    const Icon = isActive
        ? sortDirection === 'asc'
            ? ArrowUp
            : ArrowDown
        : ArrowUpDown;
    const isRight = meta.align === 'right';
    const isCenter = meta.align === 'center';

    return (
        <TableHead
            ref={cellRef}
            className={cn(
                'relative transition-[background-color,opacity] duration-150',
                isRight && 'text-right',
                isCenter && 'text-center',
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
                <button
                    type="button"
                    onClick={() => onSort(meta.key)}
                    className={cn(
                        'hover:text-foreground inline-flex items-center gap-1',
                        isRight && 'flex-row-reverse',
                        isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {meta.label}
                    <Icon className="size-3.5" />
                </button>
            </div>
            <ResizeHandle onMouseDown={onResizeStart} />
        </TableHead>
    );
}

export default function PedidoDetallesTable({
    pedidos,
    routes,
    eliminados = false,
}: Props) {
    const { puedeCosto } = useTiposPrecio();
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<ColumnKey | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [filters, setFilters] = useState<Partial<Record<ColumnKey, string>>>(
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
        () => new Set<ColumnKey>(['codigoPedido']),
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
        () =>
            columnOrder.filter(
                (key) =>
                    !hiddenColumns.has(key) &&
                    (puedeCosto || !COSTO_COLUMNS.includes(key)),
            ),
        [columnOrder, hiddenColumns, puedeCosto],
    );

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

    const detalleRows = useMemo<DetalleRow[]>(
        () =>
            pedidos.flatMap((pedido) =>
                (pedido.detalles ?? []).map((detalle) => ({
                    id: detalle.id,
                    pedidoId: pedido.id,
                    bodega: pedido.bodega?.nombre_bodega ?? '—',
                    stockTotal: stockTotalFor(detalle),
                    tipoVehiculo: detalle.producto?.tipo_vehiculo ?? '—',
                    producto: productoLabelFor(detalle),
                    fecha: pedido.fecha,
                    cantidad: Number(detalle.cantidad),
                    precioUnitario: Number(detalle.precio_unitario),
                    costoUnitario: Number(detalle.costo_unitario ?? 0),
                    costoTotal: Number(detalle.costo_total ?? 0),
                    gananciaTotal: Number(detalle.ganancia_total ?? 0),
                    subtotal: Number(detalle.subtotal),
                    cliente: pedido.cliente?.razon_social ?? '—',
                    usuario: pedido.user?.name ?? '—',
                })),
            ),
        [pedidos],
    );

    const visibleRows = useMemo(() => {
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

        let list = detalleRows.filter((row) => {
            if (term && !searchableText(row).includes(term)) {
                return false;
            }

            if (fromTime !== null || toTime !== null) {
                const fechaTime = row.fecha
                    ? new Date(row.fecha).getTime()
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
                const cellValue = String(getSortValue(row, key))
                    .toLowerCase()
                    .trim();

                if (key === 'tipoVehiculo') {
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
    }, [detalleRows, search, filters, dateRange, sortKey, sortDirection]);

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
    }, [search, filters, dateRange, sortKey, sortDirection]);

    const renderFilterHead = (meta: ColumnMeta): ReactNode => {
        if (meta.filter === 'date') {
            return (
                <TableHead key={meta.key}>
                    <DateRangeFilter
                        value={dateRange}
                        onChange={setDateRange}
                        title="Filtrar por fecha"
                        dataTest="detalle-pedidos-filter-fecha"
                    />
                </TableHead>
            );
        }

        return (
            <FilterCell
                key={meta.key}
                filterKey={meta.key}
                value={filters[meta.key] ?? ''}
                onChange={setFilter}
                variant={
                    meta.filter === 'tipoVehiculo' ? 'tipoVehiculo' : 'text'
                }
                align={meta.align === 'center' ? 'center' : meta.align}
            />
        );
    };

    const renderBodyCell = (key: ColumnKey, row: DetalleRow): ReactNode => {
        switch (key) {
            case 'id':
                return row.id;
            case 'bodega':
                return (
                    <Badge
                        variant="secondary"
                        className="max-w-full truncate"
                        title={row.bodega}
                    >
                        {row.bodega}
                    </Badge>
                );
            case 'codigoPedido':
                if (eliminados) {
                    return <span>#{row.pedidoId}</span>;
                }

                return (
                    <Link
                        href={routes.pedidos.edit([row.pedidoId])}
                        className="text-primary hover:underline"
                    >
                        #{row.pedidoId}
                    </Link>
                );
            case 'stockTotal':
                return (
                    <Badge
                        className={cn(
                            'border-transparent',
                            row.stockTotal > 0
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-100 text-red-700 hover:bg-red-100',
                        )}
                    >
                        {row.stockTotal}
                    </Badge>
                );
            case 'tipoVehiculo':
                return <TruncatedCell value={row.tipoVehiculo} />;
            case 'producto':
                return <TruncatedCell value={row.producto} />;
            case 'fecha':
                return row.fecha
                    ? new Date(row.fecha).toLocaleDateString('es-CO')
                    : '—';
            case 'cantidad':
                return row.cantidad;
            case 'precioUnitario':
                return currencyFormatter.format(row.precioUnitario);
            case 'costoUnitario':
                return currencyFormatter.format(row.costoUnitario);
            case 'costoTotal':
                return currencyFormatter.format(row.costoTotal);
            case 'gananciaTotal':
                return currencyFormatter.format(row.gananciaTotal);
            case 'subtotal':
                return currencyFormatter.format(row.subtotal);
            case 'cliente':
                return <TruncatedCell value={row.cliente} />;
            case 'usuario':
                return <TruncatedCell value={row.usuario} />;
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
                        placeholder="Buscar detalles..."
                        className="pl-9"
                        data-test="detalle-pedidos-search"
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-test="detalle-pedidos-columns-toggle"
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
                        {COLUMN_DEFS.filter(
                            (meta) =>
                                puedeCosto || !COSTO_COLUMNS.includes(meta.key),
                        ).map((meta) => (
                            <DropdownMenuCheckboxItem
                                key={meta.key}
                                checked={!hiddenColumns.has(meta.key)}
                                onSelect={(event) => event.preventDefault()}
                                onCheckedChange={() =>
                                    toggleColumnVisibility(meta.key)
                                }
                                data-test={`detalle-pedidos-column-toggle-${meta.key}`}
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
                    <TableHeader className="bg-muted sticky top-0 z-20 shadow-sm">
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
                        {paginatedRows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-test="detalle-pedido-row"
                            >
                                {visibleColumnOrder.map((key) => {
                                    const meta = COLUMN_DEFS_MAP.get(key)!;

                                    return (
                                        <TableCell
                                            key={key}
                                            className={cn(
                                                meta.align === 'right' &&
                                                    'text-right',
                                                meta.align === 'center' &&
                                                    'text-center',
                                            )}
                                        >
                                            {renderBodyCell(key, row)}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </table>
            </div>

            {visibleRows.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                    {detalleRows.length === 0
                        ? 'No hay detalles de pedidos registrados.'
                        : 'Ningún detalle coincide con la búsqueda.'}
                </p>
            ) : (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                        Mostrando {(currentPage - 1) * pageSize + 1}–
                        {Math.min(currentPage * pageSize, visibleRows.length)}{' '}
                        de {visibleRows.length} detalles
                    </p>

                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        dataTest="detalle-pedidos-page"
                    />
                </div>
            )}

            {activeFilterCount > 0 && visibleRows.length > 0 ? (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        data-test="detalle-pedidos-clear-filters"
                        onClick={clearFilters}
                    >
                        <X className="size-4" />
                        Limpiar filtros
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
