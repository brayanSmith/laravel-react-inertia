import { Head, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import CreateProductoModal from '@/components/create-producto-modal';
import DeleteProductoModal from '@/components/delete-producto-modal';
import EditProductoModal from '@/components/edit-producto-modal';
import Heading from '@/components/heading';
import ProductoDetalleModal from '@/components/producto-detalle-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { index } from '@/routes/productos';
import type {
    Bodega,
    CategoriaProducto,
    MarcaOption,
    Producto,
    ProductoPermissions,
} from '@/types';

type CategoriaTab = CategoriaProducto | 'TODOS';

const CATEGORIA_TABS: { value: CategoriaTab; label: string }[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'LLANTA', label: 'Llantas' },
    { value: 'RIN', label: 'Rines' },
    { value: 'SERVICIO', label: 'Servicios' },
    { value: 'OTRO', label: 'Otros' },
];

type Props = {
    productos: Producto[];
    bodegas: Bodega[];
    marcas: MarcaOption[];
    permissions: ProductoPermissions;
};

type Accessor = {
    label: string;
    align?: 'right';
    color?: string;
    get: (producto: Producto) => string | number;
};

type SortEntry = { key: string; direction: 'asc' | 'desc' };

const SIN_TIPO = 'Sin tipo';
const SIN_RIN = 'Sin rin';

const MIN_COLUMN_WIDTH = 60;

const STATIC_COLUMN_WIDTHS: Record<string, number> = {
    imagen: 70,
    producto: 220,
    stock_total: 100,
    pendiente: 100,
    almacen_p: 150,
    costo: 110,
    detal: 110,
    mayorista: 110,
    sin_instalacion: 130,
    acciones: 100,
};

const DEFAULT_BODEGA_WIDTH = 110;

const STATIC_COLUMN_ORDER = [
    'producto',
    'stock_total',
    'pendiente',
    'almacen_p',
    'costo',
    'detal',
    'mayorista',
    'sin_instalacion',
] as const;

const STATIC_ACCESSORS: Record<string, Accessor> = {
    producto: {
        label: 'Producto',
        get: (p) => p.concatenar_codigo_nombre ?? p.referencia_producto ?? '',
    },
    stock_total: {
        label: 'Stock total',
        align: 'right',
        get: (p) => p.stock_total ?? 0,
    },
    pendiente: {
        label: 'Pendiente',
        align: 'right',
        get: (p) => p.pendiente ?? 0,
    },
    almacen_p: {
        label: 'Almacen_P',
        get: (p) => p.proveedor_pendiente ?? '',
    },
    costo: {
        label: 'Costo',
        align: 'right',
        color: 'text-blue-600 dark:text-blue-400',
        get: (p) => Number(p.costo_producto ?? 0),
    },
    detal: {
        label: 'Detal',
        align: 'right',
        color: 'text-emerald-600 dark:text-emerald-400',
        get: (p) => Number(p.valor_detal ?? 0),
    },
    mayorista: {
        label: 'Mayorista',
        align: 'right',
        color: 'text-amber-600 dark:text-amber-400',
        get: (p) => Number(p.valor_mayorista ?? 0),
    },
    sin_instalacion: {
        label: 'Sin Instalación',
        align: 'right',
        color: 'text-red-600 dark:text-red-400',
        get: (p) => Number(p.valor_sin_instalacion ?? 0),
    },
};

function compareValues(a: string | number, b: string | number): number {
    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }

    return String(a).localeCompare(String(b), 'es', {
        sensitivity: 'base',
        numeric: true,
    });
}

function ResizeHandle({
    columnKey,
    onMouseDown,
}: {
    columnKey: string;
    onMouseDown: (event: React.MouseEvent) => void;
}) {
    return (
        <span
            onMouseDown={onMouseDown}
            data-test={`productos-resize-${columnKey}`}
            className="hover:bg-primary/50 absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize touch-none select-none"
        />
    );
}

function SortableHead({
    columnKey,
    accessor,
    sorts,
    onSort,
    onRemoveSort,
    onResizeStart,
}: {
    columnKey: string;
    accessor: Accessor;
    sorts: SortEntry[];
    onSort: (key: string) => void;
    onRemoveSort: (key: string) => void;
    onResizeStart: (event: React.MouseEvent) => void;
}) {
    const activeIndex = sorts.findIndex((s) => s.key === columnKey);
    const isActive = activeIndex !== -1;
    const direction = isActive ? sorts[activeIndex].direction : 'asc';
    const Icon = isActive
        ? direction === 'asc'
            ? ArrowUp
            : ArrowDown
        : ArrowUpDown;

    return (
        <TableHead
            className={cn(
                'relative',
                accessor.align === 'right' ? 'text-right' : undefined,
            )}
        >
            <span
                className={cn(
                    'inline-flex items-center gap-1 whitespace-nowrap',
                    accessor.align === 'right' && 'flex-row-reverse',
                )}
            >
                <button
                    type="button"
                    onClick={() => onSort(columnKey)}
                    data-test={`productos-sort-${columnKey}`}
                    className={cn(
                        'hover:text-foreground inline-flex items-center gap-1',
                        isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                    )}
                >
                    {accessor.label}
                    <Icon className="size-3.5" />
                </button>
                {isActive && sorts.length > 1 ? (
                    <button
                        type="button"
                        onClick={() => onRemoveSort(columnKey)}
                        title="Quitar del orden"
                        data-test={`productos-sort-remove-${columnKey}`}
                        className="bg-muted text-muted-foreground hover:bg-destructive hover:text-white rounded-full px-1.5 text-[10px]"
                    >
                        {activeIndex + 1}
                    </button>
                ) : null}
            </span>
            <ResizeHandle columnKey={columnKey} onMouseDown={onResizeStart} />
        </TableHead>
    );
}

function FilterHead({
    columnKey,
    accessor,
    value,
    onChange,
}: {
    columnKey: string;
    accessor: Accessor;
    value: string;
    onChange: (key: string, value: string) => void;
}) {
    return (
        <TableHead className={accessor.align === 'right' ? 'text-right' : undefined}>
            <Input
                value={value}
                onChange={(event) => onChange(columnKey, event.target.value)}
                placeholder="Filtrar..."
                className="h-8 text-xs"
                data-test={`productos-filter-${columnKey}`}
            />
        </TableHead>
    );
}

export default function ProductosIndex({
    productos,
    bodegas,
    marcas,
    permissions,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productoToDelete, setProductoToDelete] = useState<Producto | null>(
        null,
    );
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [productoToEdit, setProductoToEdit] = useState<Producto | null>(
        null,
    );
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [productoToView, setProductoToView] = useState<Producto | null>(
        null,
    );
    const [sorts, setSorts] = useState<SortEntry[]>([]);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [activeGroup, setActiveGroup] = useState<{
        tipoVehiculo: string;
        rin?: string;
    } | null>(null);
    const [categoriaTab, setCategoriaTab] = useState<CategoriaTab>('TODOS');
    const [page, setPage] = useState(1);
    const pageSize = 25;
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
        () => {
            const widths = { ...STATIC_COLUMN_WIDTHS };
            bodegas.forEach((bodega) => {
                widths[`bodega_${bodega.id}`] = DEFAULT_BODEGA_WIDTH;
            });
            return widths;
        },
    );
    const resizingKeyRef = useRef<string | null>(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);

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

    const startResize = (key: string) => (event: React.MouseEvent) => {
        event.preventDefault();
        resizingKeyRef.current = key;
        resizeStartXRef.current = event.clientX;
        resizeStartWidthRef.current = columnWidths[key] ?? MIN_COLUMN_WIDTH;
    };

    const openDeleteDialog = (producto: Producto) => {
        setProductoToDelete(producto);
        setDeleteDialogOpen(true);
    };

    const openEditDialog = (producto: Producto) => {
        setProductoToEdit(producto);
        setEditDialogOpen(true);
    };

    const openViewDialog = (producto: Producto) => {
        setProductoToView(producto);
        setViewDialogOpen(true);
    };

    const bodegaColumnKeys = useMemo(
        () => bodegas.map((bodega) => `bodega_${bodega.id}`),
        [bodegas],
    );

    const accessors = useMemo(() => {
        const map: Record<string, Accessor> = { ...STATIC_ACCESSORS };

        bodegas.forEach((bodega) => {
            map[`bodega_${bodega.id}`] = {
                label: bodega.nombre_bodega,
                align: 'right',
                get: (p) => p.stock_por_bodega?.[bodega.id] ?? 0,
            };
        });

        return map;
    }, [bodegas]);

    const columnOrder = useMemo(
        () => [...STATIC_COLUMN_ORDER, ...bodegaColumnKeys],
        [bodegaColumnKeys],
    );

    const allColumnKeys = useMemo(
        () => ['imagen', ...columnOrder, 'acciones'],
        [columnOrder],
    );

    const categoryFilteredProductos = useMemo(() => {
        if (categoriaTab === 'TODOS') {
            return productos;
        }

        return productos.filter(
            (producto) => producto.categoria === categoriaTab,
        );
    }, [productos, categoriaTab]);

    const categoriaCounts = useMemo(() => {
        const counts: Record<string, number> = { TODOS: productos.length };

        productos.forEach((producto) => {
            const categoria = producto.categoria ?? 'TODOS';
            counts[categoria] = (counts[categoria] ?? 0) + 1;
        });

        return counts;
    }, [productos]);

    const handleCategoriaTabChange = (value: string) => {
        setCategoriaTab(value as CategoriaTab);
        setActiveGroup(null);
    };

    const groupTree = useMemo(() => {
        const tipos = new Map<string, Map<string, number>>();

        categoryFilteredProductos.forEach((producto) => {
            const tipo = producto.tipo_vehiculo ?? SIN_TIPO;
            const rin = producto.rin ?? SIN_RIN;

            if (!tipos.has(tipo)) {
                tipos.set(tipo, new Map());
            }

            const rines = tipos.get(tipo)!;
            rines.set(rin, (rines.get(rin) ?? 0) + 1);
        });

        return Array.from(tipos.entries())
            .map(([tipo, rines]) => ({
                tipo,
                count: Array.from(rines.values()).reduce((a, b) => a + b, 0),
                rines: Array.from(rines.entries())
                    .map(([rin, count]) => ({ rin, count }))
                    .sort((a, b) =>
                        a.rin.localeCompare(b.rin, 'es', { numeric: true }),
                    ),
            }))
            .sort((a, b) => a.tipo.localeCompare(b.tipo, 'es'));
    }, [categoryFilteredProductos]);

    const handleSort = (key: string) => {
        setSorts((prev) => {
            const index = prev.findIndex((s) => s.key === key);

            if (index === -1) {
                return [...prev, { key, direction: 'asc' }];
            }

            if (prev[index].direction === 'asc') {
                const next = [...prev];
                next[index] = { key, direction: 'desc' };
                return next;
            }

            return prev.filter((s) => s.key !== key);
        });
    };

    const setFilter = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const resetSort = () => setSorts([]);

    const removeSort = (key: string) => {
        setSorts((prev) => prev.filter((s) => s.key !== key));
    };

    const clearFiltersAndGroup = () => {
        setFilters({});
        setActiveGroup(null);
    };

    const activeFilterCount = Object.values(filters).filter(
        (value) => value.trim() !== '',
    ).length;

    const visibleProductos = useMemo(() => {
        const activeFilters = Object.entries(filters).filter(
            ([, value]) => value.trim() !== '',
        );

        let list = categoryFilteredProductos.filter((producto) => {
            if (activeGroup) {
                const tipo = producto.tipo_vehiculo ?? SIN_TIPO;

                if (tipo !== activeGroup.tipoVehiculo) {
                    return false;
                }

                if (activeGroup.rin) {
                    const rin = producto.rin ?? SIN_RIN;

                    if (rin !== activeGroup.rin) {
                        return false;
                    }
                }
            }

            return activeFilters.every(([key, value]) => {
                const accessor = accessors[key];

                if (!accessor) {
                    return true;
                }

                return String(accessor.get(producto))
                    .toLowerCase()
                    .includes(value.toLowerCase().trim());
            });
        });

        if (sorts.length > 0) {
            list = [...list].sort((a, b) => {
                for (const { key, direction } of sorts) {
                    const accessor = accessors[key];

                    if (!accessor) {
                        continue;
                    }

                    const comparison = compareValues(
                        accessor.get(a),
                        accessor.get(b),
                    );

                    if (comparison !== 0) {
                        return direction === 'asc' ? comparison : -comparison;
                    }
                }

                return 0;
            });
        }

        return list;
    }, [categoryFilteredProductos, filters, sorts, activeGroup, accessors]);

    const totalPages = Math.max(
        Math.ceil(visibleProductos.length / pageSize),
        1,
    );
    const currentPage = Math.min(page, totalPages);

    const paginatedProductos = useMemo(
        () =>
            visibleProductos.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize,
            ),
        [visibleProductos, currentPage],
    );

    useEffect(() => {
        setPage(1);
    }, [filters, sorts, activeGroup, categoriaTab]);

    function renderCellValue(key: string, producto: Producto) {
        const accessor = accessors[key];

        if (!accessor) {
            return null;
        }

        const value = accessor.get(producto);

        if (key === 'pendiente') {
            return value ? <Badge variant="secondary">{value}</Badge> : 0;
        }

        if (key === 'stock_total' || key.startsWith('bodega_')) {
            const hasStock = Number(value) > 0;

            return (
                <Badge
                    className={cn(
                        'border-transparent',
                        hasStock
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400',
                    )}
                >
                    {value}
                </Badge>
            );
        }

        if (value === '' || value === null || value === undefined) {
            return '—';
        }

        if (typeof value === 'string') {
            return (
                <span className="block truncate" title={value}>
                    {value}
                </span>
            );
        }

        return value;
    }

    return (
        <>
            <Head title="Productos" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Productos"
                        description="Administra el catálogo de productos"
                    />

                    {permissions.canCreate ? (
                        <CreateProductoModal
                            teamSlug={teamSlug}
                            marcas={marcas}
                        >
                            <Button data-test="create-producto-button">
                                <Plus /> Nuevo producto
                            </Button>
                        </CreateProductoModal>
                    ) : null}
                </div>

                <Tabs
                    value={categoriaTab}
                    onValueChange={handleCategoriaTabChange}
                >
                    <TabsList data-test="productos-categoria-tabs">
                        {CATEGORIA_TABS.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                data-test={`productos-categoria-tab-${tab.value}`}
                            >
                                {tab.label}
                                <span className="text-muted-foreground ml-1 text-xs">
                                    {categoriaCounts[tab.value] ?? 0}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="flex gap-4">
                    <aside className="w-56 shrink-0 space-y-1 rounded-lg border p-3 text-sm">
                        <div className="mb-2 font-semibold">
                            Tipo de vehículo / Rin
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveGroup(null)}
                            data-test="productos-group-all"
                            className={cn(
                                'flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-accent',
                                !activeGroup &&
                                    'bg-accent text-accent-foreground',
                            )}
                        >
                            <span>Todos</span>
                            <span className="text-muted-foreground text-xs">
                                {categoryFilteredProductos.length}
                            </span>
                        </button>

                        <div className="max-h-[60vh] overflow-y-auto pr-1">
                            {groupTree.map((group) => (
                                <div key={group.tipo} className="mt-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveGroup({
                                                tipoVehiculo: group.tipo,
                                            })
                                        }
                                        data-test={`productos-group-tipo-${group.tipo}`}
                                        className={cn(
                                            'flex w-full items-center justify-between rounded px-2 py-1 text-left font-medium hover:bg-accent',
                                            activeGroup?.tipoVehiculo ===
                                                group.tipo &&
                                                !activeGroup?.rin &&
                                                'bg-accent text-accent-foreground',
                                        )}
                                    >
                                        <span>{group.tipo}</span>
                                        <span className="text-muted-foreground text-xs">
                                            {group.count}
                                        </span>
                                    </button>

                                    <div className="ml-3 border-l pl-2">
                                        {group.rines.map((rin) => (
                                            <button
                                                key={rin.rin}
                                                type="button"
                                                onClick={() =>
                                                    setActiveGroup({
                                                        tipoVehiculo:
                                                            group.tipo,
                                                        rin: rin.rin,
                                                    })
                                                }
                                                data-test={`productos-group-rin-${group.tipo}-${rin.rin}`}
                                                className={cn(
                                                    'flex w-full items-center justify-between rounded px-2 py-1 text-left text-muted-foreground hover:bg-accent',
                                                    activeGroup?.tipoVehiculo ===
                                                        group.tipo &&
                                                        activeGroup?.rin ===
                                                            rin.rin &&
                                                        'bg-accent text-accent-foreground',
                                                )}
                                            >
                                                <span>{rin.rin}</span>
                                                <span className="text-xs">
                                                    {rin.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="overflow-x-auto rounded-lg border">
                            <Table className="table-fixed [&_tr]:divide-x">
                                <colgroup>
                                    {allColumnKeys.map((key) => (
                                        <col
                                            key={key}
                                            style={{
                                                width: columnWidths[key],
                                            }}
                                        />
                                    ))}
                                </colgroup>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="relative">
                                            Imagen
                                            <ResizeHandle
                                                columnKey="imagen"
                                                onMouseDown={startResize(
                                                    'imagen',
                                                )}
                                            />
                                        </TableHead>
                                        {columnOrder.map((key) => (
                                            <SortableHead
                                                key={key}
                                                columnKey={key}
                                                accessor={accessors[key]}
                                                sorts={sorts}
                                                onSort={handleSort}
                                                onRemoveSort={removeSort}
                                                onResizeStart={startResize(
                                                    key,
                                                )}
                                            />
                                        ))}
                                        <TableHead className="relative text-right">
                                            {sorts.length > 0 ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    data-test="productos-reset-sort"
                                                    onClick={resetSort}
                                                >
                                                    <ArrowUpDown className="size-4" />
                                                    Resetear orden
                                                </Button>
                                            ) : (
                                                'Acciones'
                                            )}
                                            <ResizeHandle
                                                columnKey="acciones"
                                                onMouseDown={startResize(
                                                    'acciones',
                                                )}
                                            />
                                        </TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead />
                                        {columnOrder.map((key) => (
                                            <FilterHead
                                                key={key}
                                                columnKey={key}
                                                accessor={accessors[key]}
                                                value={filters[key] ?? ''}
                                                onChange={setFilter}
                                            />
                                        ))}
                                        <TableHead className="text-right">
                                            {activeFilterCount > 0 ||
                                            activeGroup ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    data-test="productos-clear-filters"
                                                    onClick={
                                                        clearFiltersAndGroup
                                                    }
                                                >
                                                    <X className="size-4" />
                                                    Limpiar
                                                </Button>
                                            ) : null}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedProductos.map((producto) => (
                                        <TableRow
                                            key={producto.id}
                                            data-test="producto-row"
                                            onClick={() =>
                                                openViewDialog(producto)
                                            }
                                            className="cursor-pointer"
                                        >
                                            <TableCell>
                                                {producto.imagen_producto_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setPreviewImage(
                                                                producto.imagen_producto_url,
                                                            );
                                                        }}
                                                        data-test="producto-imagen-preview"
                                                        className="cursor-zoom-in"
                                                    >
                                                        <img
                                                            src={
                                                                producto.imagen_producto_url
                                                            }
                                                            alt=""
                                                            loading="lazy"
                                                            className="h-10 w-10 rounded-md border object-cover transition hover:opacity-80"
                                                        />
                                                    </button>
                                                ) : (
                                                    <div className="text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md border text-xs">
                                                        —
                                                    </div>
                                                )}
                                            </TableCell>
                                            {columnOrder.map((key) => (
                                                <TableCell
                                                    key={key}
                                                    className={cn(
                                                        accessors[key]
                                                            ?.align ===
                                                            'right' &&
                                                            'text-right',
                                                        accessors[key]?.color,
                                                    )}
                                                >
                                                    {renderCellValue(
                                                        key,
                                                        producto,
                                                    )}
                                                </TableCell>
                                            ))}
                                            <TableCell
                                                className="text-right"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                <TooltipProvider>
                                                    <div className="flex justify-end gap-2">
                                                        {permissions.canUpdate ? (
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        data-test="edit-producto-button"
                                                                        onClick={() =>
                                                                            openEditDialog(
                                                                                producto,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>
                                                                        Editar
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : null}

                                                        {permissions.canDelete ? (
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        data-test="delete-producto-button"
                                                                        onClick={() =>
                                                                            openDeleteDialog(
                                                                                producto,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>
                                                                        Eliminar
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : null}
                                                    </div>
                                                </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {visibleProductos.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">
                                {productos.length === 0
                                    ? 'No hay productos registrados.'
                                    : 'Ningún producto coincide con los filtros.'}
                            </p>
                        ) : (
                            <div className="flex items-center justify-between text-sm">
                                <p className="text-muted-foreground">
                                    Mostrando{' '}
                                    {(currentPage - 1) * pageSize + 1}–
                                    {Math.min(
                                        currentPage * pageSize,
                                        visibleProductos.length,
                                    )}{' '}
                                    de {visibleProductos.length} productos
                                </p>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        data-test="productos-page-prev"
                                        disabled={currentPage <= 1}
                                        onClick={() =>
                                            setPage((prev) =>
                                                Math.max(prev - 1, 1),
                                            )
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
                                        data-test="productos-page-next"
                                        disabled={currentPage >= totalPages}
                                        onClick={() =>
                                            setPage((prev) =>
                                                Math.min(
                                                    prev + 1,
                                                    totalPages,
                                                ),
                                            )
                                        }
                                    >
                                        Siguiente
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DeleteProductoModal
                teamSlug={teamSlug}
                producto={productoToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />

            <EditProductoModal
                teamSlug={teamSlug}
                marcas={marcas}
                producto={productoToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <Dialog
                open={previewImage !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewImage(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Imagen del producto</DialogTitle>
                    </DialogHeader>

                    {previewImage ? (
                        <img
                            src={previewImage}
                            alt=""
                            className="max-h-[70vh] w-full rounded-md border object-contain"
                        />
                    ) : null}
                </DialogContent>
            </Dialog>

            <ProductoDetalleModal
                producto={productoToView}
                bodegas={bodegas}
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
            />
        </>
    );
}

ProductosIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Productos',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
