import type { PaginationState, SortingState } from '@tanstack/react-table';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Pencil,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
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
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { Producto } from '@/types';

const PER_PAGE_OPTIONS = [15, 25, 50, 100];

const currencyFormatter = new Intl.NumberFormat('es', {
    style: 'currency',
    currency: 'USD',
});

type Props = {
    productos: Producto[];
    onEdit: (producto: Producto) => void;
    onDelete: (producto: Producto) => void;
};

export default function ProductosTable({ productos, onEdit, onDelete }: Props) {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, 200);

    const [sorting, setSorting] = useState<SortingState>([
        { id: 'nombre', desc: false },
    ]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 15,
    });

    useEffect(() => {
        setPagination((previous) => ({ ...previous, pageIndex: 0 }));
    }, [debouncedSearch]);

    const columnHelper = useMemo(() => createColumnHelper<Producto>(), []);

    const columns = useMemo(
        () => [
            columnHelper.accessor('codigo', { header: 'Código' }),
            columnHelper.accessor('nombre', { header: 'Nombre' }),
            columnHelper.accessor('costo', {
                header: 'Costo',
                cell: (info) => currencyFormatter.format(info.getValue()),
            }),
            columnHelper.accessor('precio_detal', {
                header: 'Precio detal',
                cell: (info) => currencyFormatter.format(info.getValue()),
            }),
            columnHelper.accessor('precio_mayorista', {
                header: 'Precio mayorista',
                cell: (info) => currencyFormatter.format(info.getValue()),
            }),
            columnHelper.accessor('precio_especial', {
                header: 'Precio especial',
                cell: (info) => currencyFormatter.format(info.getValue()),
            }),
            columnHelper.display({
                id: 'actions',
                header: '',
                enableSorting: false,
                enableGlobalFilter: false,
                cell: (info) => (
                    <TooltipProvider>
                        <div className="flex justify-end gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        data-test="producto-edit-button"
                                        onClick={() =>
                                            onEdit(info.row.original)
                                        }
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Editar producto</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        data-test="producto-delete-button"
                                        onClick={() =>
                                            onDelete(info.row.original)
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Eliminar producto</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                ),
            }),
        ],
        [columnHelper, onDelete, onEdit],
    );

    const table = useReactTable({
        data: productos,
        columns,
        state: {
            sorting,
            pagination,
            globalFilter: debouncedSearch,
        },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        enableSortingRemoval: false,
        enableMultiSort: false,
    });

    const filteredCount = table.getFilteredRowModel().rows.length;
    const pageStart =
        filteredCount === 0
            ? 0
            : pagination.pageIndex * pagination.pageSize + 1;
    const pageEnd = Math.min(
        (pagination.pageIndex + 1) * pagination.pageSize,
        filteredCount,
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
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

                <Select
                    value={String(pagination.pageSize)}
                    onValueChange={(value) =>
                        setPagination({
                            pageIndex: 0,
                            pageSize: Number(value),
                        })
                    }
                >
                    <SelectTrigger className="w-[130px]" size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PER_PAGE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                                {option} por página
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        className={
                                            header.column.getCanSort()
                                                ? 'cursor-pointer select-none'
                                                : undefined
                                        }
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div className="flex items-center gap-1">
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                                {header.column.getCanSort() ? (
                                                    header.column.getIsSorted() ===
                                                    'asc' ? (
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    ) : header.column.getIsSorted() ===
                                                      'desc' ? (
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ArrowUpDown className="text-muted-foreground/50 h-3.5 w-3.5" />
                                                    )
                                                ) : null}
                                            </div>
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-test="producto-row">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-muted-foreground h-24 text-center"
                                >
                                    No se encontraron productos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                    {filteredCount > 0
                        ? `Mostrando ${pageStart}–${pageEnd} de ${filteredCount} productos`
                        : 'Sin resultados'}
                </p>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        data-test="productos-prev-page"
                        disabled={!table.getCanPreviousPage()}
                        onClick={() => table.previousPage()}
                    >
                        Anterior
                    </Button>
                    <span className="text-muted-foreground text-sm">
                        Página {pagination.pageIndex + 1} de{' '}
                        {Math.max(table.getPageCount(), 1)}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        data-test="productos-next-page"
                        disabled={!table.getCanNextPage()}
                        onClick={() => table.nextPage()}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
}
