import { useVirtualizer } from '@tanstack/react-virtual';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
    Pencil,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/utils';
import type { Producto } from '@/types';

const currencyFormatter = new Intl.NumberFormat('es', {
    style: 'currency',
    currency: 'USD',
});

type SortableKey =
    | 'codigo'
    | 'nombre'
    | 'costo'
    | 'precio_detal'
    | 'precio_mayorista'
    | 'precio_especial';

type Column = {
    key: SortableKey;
    label: string;
    align?: 'right';
};

const COLUMNS: Column[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'costo', label: 'Costo', align: 'right' },
    { key: 'precio_detal', label: 'Precio detal', align: 'right' },
    { key: 'precio_mayorista', label: 'Precio mayorista', align: 'right' },
    { key: 'precio_especial', label: 'Precio especial', align: 'right' },
];

const GRID_TEMPLATE = '140px minmax(160px,1fr) 110px 110px 130px 130px 96px';

type Selection =
    | { type: 'all' }
    | { type: 'categoria'; categoriaId: number }
    | { type: 'subcategoria'; categoriaId: number; subCategoriaId: number };

type Props = {
    productos: Producto[];
    onEdit: (producto: Producto) => void;
    onDelete: (producto: Producto) => void;
};

export default function ProductosTable({ productos, onEdit, onDelete }: Props) {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, 200);

    const [sortKey, setSortKey] = useState<SortableKey>('nombre');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [selection, setSelection] = useState<Selection>({ type: 'all' });
    const [expandedCategorias, setExpandedCategorias] = useState<Set<number>>(
        new Set(),
    );

    const toggleSort = (key: SortableKey) => {
        if (sortKey === key) {
            setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const toggleExpanded = (categoriaId: number) => {
        setExpandedCategorias((previous) => {
            const next = new Set(previous);
            if (next.has(categoriaId)) {
                next.delete(categoriaId);
            } else {
                next.add(categoriaId);
            }
            return next;
        });
    };

    // The navigator always reflects the full catalog, regardless of the
    // current selection or search, so it can be used to jump elsewhere.
    const groups = useMemo(() => {
        const byCategoria = new Map<
            number,
            {
                categoria: string;
                subCategorias: Map<
                    number,
                    { subCategoria: string; count: number }
                >;
            }
        >();

        for (const producto of productos) {
            if (!byCategoria.has(producto.categoria_id)) {
                byCategoria.set(producto.categoria_id, {
                    categoria: producto.categoria_nombre ?? '—',
                    subCategorias: new Map(),
                });
            }

            const categoriaGroup = byCategoria.get(producto.categoria_id)!;

            if (!categoriaGroup.subCategorias.has(producto.sub_categoria_id)) {
                categoriaGroup.subCategorias.set(producto.sub_categoria_id, {
                    subCategoria: producto.sub_categoria_nombre ?? '—',
                    count: 0,
                });
            }

            categoriaGroup.subCategorias.get(
                producto.sub_categoria_id,
            )!.count += 1;
        }

        return [...byCategoria.entries()]
            .sort((a, b) => a[1].categoria.localeCompare(b[1].categoria))
            .map(([categoriaId, categoriaGroup]) => {
                const subCategorias = [
                    ...categoriaGroup.subCategorias.entries(),
                ]
                    .sort((a, b) =>
                        a[1].subCategoria.localeCompare(b[1].subCategoria),
                    )
                    .map(([subCategoriaId, subCategoriaGroup]) => ({
                        subCategoriaId,
                        subCategoria: subCategoriaGroup.subCategoria,
                        count: subCategoriaGroup.count,
                    }));

                return {
                    categoriaId,
                    categoria: categoriaGroup.categoria,
                    count: subCategorias.reduce(
                        (sum, subCategoriaGroup) =>
                            sum + subCategoriaGroup.count,
                        0,
                    ),
                    subCategorias,
                };
            });
    }, [productos]);

    const totalCount = useMemo(
        () =>
            groups.reduce(
                (sum, categoriaGroup) => sum + categoriaGroup.count,
                0,
            ),
        [groups],
    );

    const selectionLabel = useMemo(() => {
        if (selection.type === 'all') {
            return null;
        }

        const categoriaGroup = groups.find(
            (group) => group.categoriaId === selection.categoriaId,
        );

        if (selection.type === 'categoria') {
            return categoriaGroup?.categoria ?? null;
        }

        const subCategoriaGroup = categoriaGroup?.subCategorias.find(
            (group) => group.subCategoriaId === selection.subCategoriaId,
        );

        return subCategoriaGroup
            ? `${categoriaGroup?.categoria} · ${subCategoriaGroup.subCategoria}`
            : null;
    }, [groups, selection]);

    const scopedProductos = useMemo(() => {
        if (selection.type === 'all') {
            return productos;
        }

        if (selection.type === 'categoria') {
            return productos.filter(
                (producto) => producto.categoria_id === selection.categoriaId,
            );
        }

        return productos.filter(
            (producto) =>
                producto.categoria_id === selection.categoriaId &&
                producto.sub_categoria_id === selection.subCategoriaId,
        );
    }, [productos, selection]);

    const filteredProductos = useMemo(() => {
        const term = debouncedSearch.trim().toLowerCase();

        if (term === '') {
            return scopedProductos;
        }

        return scopedProductos.filter(
            (producto) =>
                producto.codigo.toLowerCase().includes(term) ||
                producto.nombre.toLowerCase().includes(term),
        );
    }, [scopedProductos, debouncedSearch]);

    const sortedProductos = useMemo(() => {
        const copy = [...filteredProductos];

        copy.sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];
            const comparison =
                typeof aValue === 'number' && typeof bValue === 'number'
                    ? aValue - bValue
                    : String(aValue).localeCompare(String(bValue));

            return sortDir === 'asc' ? comparison : -comparison;
        });

        return copy;
    }, [filteredProductos, sortKey, sortDir]);

    const scrollRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: sortedProductos.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 44,
        overscan: 12,
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative max-w-sm flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por código o nombre..."
                        className="pl-8"
                        data-test="productos-search-input"
                    />
                </div>

                {selectionLabel ? (
                    <Badge
                        variant="secondary"
                        data-test="selection-badge"
                        className="gap-1 py-1.5 pr-1 pl-2.5 font-normal"
                    >
                        {selectionLabel}
                        <button
                            type="button"
                            onClick={() => setSelection({ type: 'all' })}
                            data-test="selection-clear"
                            className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ) : null}
            </div>

            <div className="flex overflow-hidden rounded-lg border">
                <div className="flex w-64 shrink-0 flex-col border-r">
                    <button
                        type="button"
                        onClick={() => setSelection({ type: 'all' })}
                        data-test="navigator-all"
                        className={cn(
                            'm-2 rounded-md px-3 py-1.5 text-left text-sm font-medium',
                            selection.type === 'all'
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted',
                        )}
                    >
                        Todo
                        <span className="text-muted-foreground ml-2 font-normal">
                            {totalCount}
                        </span>
                    </button>

                    <div
                        className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2"
                        data-test="navigator-tree"
                    >
                        {groups.map((categoriaGroup) => {
                            const isExpanded = expandedCategorias.has(
                                categoriaGroup.categoriaId,
                            );
                            const isCategoriaSelected =
                                selection.type === 'categoria' &&
                                selection.categoriaId ===
                                    categoriaGroup.categoriaId;

                            return (
                                <div key={categoriaGroup.categoriaId}>
                                    <div
                                        className={cn(
                                            'flex items-center gap-1 rounded-md pr-2',
                                            isCategoriaSelected &&
                                                'bg-primary/10',
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleExpanded(
                                                    categoriaGroup.categoriaId,
                                                )
                                            }
                                            data-test="navigator-categoria-toggle"
                                            className="text-muted-foreground p-1.5"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            ) : (
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelection({
                                                    type: 'categoria',
                                                    categoriaId:
                                                        categoriaGroup.categoriaId,
                                                })
                                            }
                                            data-test="navigator-categoria"
                                            className={cn(
                                                'flex flex-1 items-center justify-between gap-2 py-1.5 text-left text-sm',
                                                isCategoriaSelected
                                                    ? 'text-primary font-semibold'
                                                    : 'font-medium',
                                            )}
                                        >
                                            <span className="truncate">
                                                {categoriaGroup.categoria}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="shrink-0 font-normal"
                                            >
                                                {categoriaGroup.count}
                                            </Badge>
                                        </button>
                                    </div>

                                    {isExpanded
                                        ? categoriaGroup.subCategorias.map(
                                              (subCategoriaGroup) => {
                                                  const isSubSelected =
                                                      selection.type ===
                                                          'subcategoria' &&
                                                      selection.categoriaId ===
                                                          categoriaGroup.categoriaId &&
                                                      selection.subCategoriaId ===
                                                          subCategoriaGroup.subCategoriaId;

                                                  return (
                                                      <button
                                                          key={
                                                              subCategoriaGroup.subCategoriaId
                                                          }
                                                          type="button"
                                                          onClick={() =>
                                                              setSelection({
                                                                  type: 'subcategoria',
                                                                  categoriaId:
                                                                      categoriaGroup.categoriaId,
                                                                  subCategoriaId:
                                                                      subCategoriaGroup.subCategoriaId,
                                                              })
                                                          }
                                                          data-test="navigator-subcategoria"
                                                          className={cn(
                                                              'flex w-full items-center justify-between gap-2 rounded-md py-1.5 pr-2 pl-9 text-left text-sm',
                                                              isSubSelected
                                                                  ? 'bg-primary/10 text-primary font-medium'
                                                                  : 'text-muted-foreground hover:bg-muted',
                                                          )}
                                                      >
                                                          <span className="truncate">
                                                              {
                                                                  subCategoriaGroup.subCategoria
                                                              }
                                                          </span>
                                                          <Badge
                                                              variant="secondary"
                                                              className="shrink-0 font-normal"
                                                          >
                                                              {
                                                                  subCategoriaGroup.count
                                                              }
                                                          </Badge>
                                                      </button>
                                                  );
                                              },
                                          )
                                        : null}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <div
                        className="border-b"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: GRID_TEMPLATE,
                        }}
                    >
                        {COLUMNS.map((column) => (
                            <button
                                key={column.key}
                                type="button"
                                onClick={() => toggleSort(column.key)}
                                className={cn(
                                    'flex cursor-pointer items-center gap-1 px-3 py-2 text-left text-sm font-medium select-none',
                                    column.align === 'right' && 'justify-end',
                                )}
                            >
                                {column.label}
                                {sortKey === column.key ? (
                                    sortDir === 'asc' ? (
                                        <ArrowUp className="h-3.5 w-3.5" />
                                    ) : (
                                        <ArrowDown className="h-3.5 w-3.5" />
                                    )
                                ) : (
                                    <ArrowUpDown className="text-muted-foreground/50 h-3.5 w-3.5" />
                                )}
                            </button>
                        ))}
                        <div />
                    </div>

                    {sortedProductos.length ? (
                        <div
                            ref={scrollRef}
                            className="max-h-[600px] overflow-auto"
                            data-test="productos-scroll-area"
                        >
                            <div
                                style={{
                                    height: virtualizer.getTotalSize(),
                                    position: 'relative',
                                }}
                            >
                                {virtualizer
                                    .getVirtualItems()
                                    .map((virtualRow) => {
                                        const producto =
                                            sortedProductos[virtualRow.index];

                                        return (
                                            <div
                                                key={producto.id}
                                                data-index={virtualRow.index}
                                                ref={virtualizer.measureElement}
                                                data-test="producto-row"
                                                className="hover:bg-muted/50 border-b"
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                    display: 'grid',
                                                    gridTemplateColumns:
                                                        GRID_TEMPLATE,
                                                }}
                                            >
                                                <div className="truncate px-3 py-2 text-sm">
                                                    {producto.codigo}
                                                </div>
                                                <div className="truncate px-3 py-2 text-sm">
                                                    {producto.nombre}
                                                </div>
                                                <div className="px-3 py-2 text-right text-sm">
                                                    {currencyFormatter.format(
                                                        producto.costo,
                                                    )}
                                                </div>
                                                <div className="px-3 py-2 text-right text-sm">
                                                    {currencyFormatter.format(
                                                        producto.precio_detal,
                                                    )}
                                                </div>
                                                <div className="px-3 py-2 text-right text-sm">
                                                    {currencyFormatter.format(
                                                        producto.precio_mayorista,
                                                    )}
                                                </div>
                                                <div className="px-3 py-2 text-right text-sm">
                                                    {currencyFormatter.format(
                                                        producto.precio_especial,
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-end gap-1 px-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    data-test="producto-edit-button"
                                                                    onClick={() =>
                                                                        onEdit(
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
                                                                    producto
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    data-test="producto-delete-button"
                                                                    onClick={() =>
                                                                        onDelete(
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
                                                                    producto
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground p-8 text-center text-sm">
                            No se encontraron productos.
                        </p>
                    )}
                </div>
            </div>

            <p className="text-muted-foreground text-sm">
                {sortedProductos.length > 0
                    ? `${sortedProductos.length} productos`
                    : 'Sin resultados'}
            </p>
        </div>
    );
}
