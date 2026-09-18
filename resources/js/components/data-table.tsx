import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Columns3,
    GripVertical,
    Search,
    X,
} from 'lucide-react';
import DateRangeFilter from '@/components/date-range-filter';
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
import type {
    DataTableColumn,
    HeaderCellHandlers,
    UseDataTableOptions,
} from '@/hooks/use-data-table';
import { useDataTable } from '@/hooks/use-data-table';
import { cn } from '@/lib/utils';

export type { DataTableColumn } from '@/hooks/use-data-table';

type DataTableProps<T> = UseDataTableOptions<T> & {
    getRowId: (row: T) => string | number;
    dataTestPrefix: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    noResultsMessage?: string;
};

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

function HeaderCell<T>({
    column,
    activeSortKey,
    sortDirection,
    onSort,
    handlers,
    dataTest,
}: {
    column: DataTableColumn<T>;
    activeSortKey: string | null;
    sortDirection: 'asc' | 'desc';
    onSort: (key: string) => void;
    handlers: HeaderCellHandlers;
    dataTest: string;
}) {
    const isActive = column.sortable && activeSortKey === column.key;
    const Icon = isActive
        ? sortDirection === 'asc'
            ? ArrowUp
            : ArrowDown
        : ArrowUpDown;
    const isRight = column.align === 'right';

    return (
        <TableHead
            ref={handlers.cellRef}
            className={cn(
                'relative transition-[background-color,opacity] duration-150',
                isRight && 'text-right',
                handlers.isDragOver && 'bg-accent',
                handlers.isDragging && 'opacity-40',
            )}
        >
            <div
                draggable
                onDragStart={handlers.onDragStart}
                onDragOver={handlers.onDragOver}
                onDrop={handlers.onDrop}
                onDragEnd={handlers.onDragEnd}
                className={cn(
                    'inline-flex cursor-grab items-center gap-1 active:cursor-grabbing',
                    isRight && 'flex-row-reverse',
                )}
            >
                <GripVertical className="text-muted-foreground/40 size-3 shrink-0" />
                {column.sortable ? (
                    <button
                        type="button"
                        onClick={() => onSort(column.key)}
                        data-test={dataTest}
                        className={cn(
                            'hover:text-foreground inline-flex items-center gap-1',
                            isRight && 'flex-row-reverse',
                            isActive
                                ? 'text-foreground'
                                : 'text-muted-foreground',
                        )}
                    >
                        {column.label}
                        <Icon className="size-3.5" />
                    </button>
                ) : (
                    <span className="text-muted-foreground">
                        {column.label}
                    </span>
                )}
            </div>
            <ResizeHandle onMouseDown={handlers.onResizeStart} />
        </TableHead>
    );
}

function FilterCell<T>({
    column,
    value,
    dateRange,
    onChange,
    onDateChange,
    dataTest,
}: {
    column: DataTableColumn<T>;
    value: string;
    dateRange: { from: string; to: string };
    onChange: (key: string, value: string) => void;
    onDateChange: (key: string, value: { from: string; to: string }) => void;
    dataTest: string;
}) {
    const align = column.align === 'right' ? 'text-right' : undefined;

    if (column.filter === 'none') {
        return <TableHead className={align} />;
    }

    if (column.filter === 'date') {
        return (
            <TableHead>
                <DateRangeFilter
                    value={dateRange}
                    onChange={(next) => onDateChange(column.key, next)}
                    title={`Filtrar por ${column.label.toLowerCase()}`}
                    dataTest={dataTest}
                />
            </TableHead>
        );
    }

    if (column.filter === 'select') {
        return (
            <TableHead className={align}>
                <Select
                    value={value === '' ? 'ALL' : value}
                    onValueChange={(next) =>
                        onChange(column.key, next === 'ALL' ? '' : next)
                    }
                >
                    <SelectTrigger
                        size="sm"
                        className="h-8 w-full text-xs"
                        data-test={dataTest}
                    >
                        <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        {(column.selectOptions ?? []).map((option) => (
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
        <TableHead className={align}>
            <Input
                value={value}
                onChange={(event) => onChange(column.key, event.target.value)}
                placeholder="Filtrar..."
                className="h-8 text-xs"
                data-test={dataTest}
            />
        </TableHead>
    );
}

/**
 * A full-featured, reusable index table: search, per-column sort/filter,
 * resizable + drag-to-reorder columns (with a FLIP move animation),
 * show/hide columns and client-side pagination. Give it row data and
 * column definitions; it owns everything else. State lives in
 * `useDataTable`, which this component is a thin renderer over — reach
 * for the hook directly if a page needs a materially different layout.
 */
export default function DataTable<T>({
    data,
    columns,
    getRowId,
    dataTestPrefix,
    searchPlaceholder = 'Buscar...',
    emptyMessage = 'No hay registros.',
    noResultsMessage = 'Ningún registro coincide con la búsqueda.',
    pageSize,
    searchableText,
}: DataTableProps<T>) {
    const table = useDataTable({ data, columns, pageSize, searchableText });

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="relative max-w-sm flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        value={table.search}
                        onChange={(event) =>
                            table.setSearch(event.target.value)
                        }
                        placeholder={searchPlaceholder}
                        className="pl-9"
                        data-test={`${dataTestPrefix}-search`}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {table.activeFilterCount > 0 ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            data-test={`${dataTestPrefix}-clear-filters`}
                            onClick={table.clearFilters}
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
                                data-test={`${dataTestPrefix}-columns-toggle`}
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
                            {table.hideableColumns.map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.key}
                                    checked={
                                        !table.hiddenColumns.has(column.key)
                                    }
                                    onSelect={(event) =>
                                        event.preventDefault()
                                    }
                                    onCheckedChange={() =>
                                        table.toggleColumnVisibility(
                                            column.key,
                                        )
                                    }
                                    data-test={`${dataTestPrefix}-column-toggle-${column.key}`}
                                >
                                    {column.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="relative max-h-[75vh] w-full overflow-auto rounded-md border">
                <table className="w-full table-fixed caption-bottom text-sm [&_tr]:divide-x">
                    <colgroup>
                        {table.visibleColumnOrder.map((key) => (
                            <col
                                key={key}
                                style={{ width: table.columnWidths[key] }}
                            />
                        ))}
                    </colgroup>
                    <TableHeader className="bg-background sticky top-0 z-20 shadow-sm">
                        <TableRow>
                            {table.visibleColumnOrder.map((key) => {
                                const column = table.columnsMap.get(key)!;

                                return (
                                    <HeaderCell
                                        key={key}
                                        column={column}
                                        activeSortKey={
                                            table.sort?.key ?? null
                                        }
                                        sortDirection={
                                            table.sort?.direction ?? 'asc'
                                        }
                                        onSort={table.handleSort}
                                        handlers={table.getHeaderCellHandlers(
                                            key,
                                        )}
                                        dataTest={`${dataTestPrefix}-sort-${key}`}
                                    />
                                );
                            })}
                        </TableRow>
                        <TableRow>
                            {table.visibleColumnOrder.map((key) => {
                                const column = table.columnsMap.get(key)!;

                                return (
                                    <FilterCell
                                        key={key}
                                        column={column}
                                        value={table.filters[key] ?? ''}
                                        dateRange={
                                            table.dateRanges[key] ?? {
                                                from: '',
                                                to: '',
                                            }
                                        }
                                        onChange={table.setFilter}
                                        onDateChange={table.setDateRange}
                                        dataTest={`${dataTestPrefix}-filter-${key}`}
                                    />
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {table.rows.map((row) => (
                            <TableRow
                                key={getRowId(row)}
                                data-test={`${dataTestPrefix}-row`}
                            >
                                {table.visibleColumnOrder.map((key) => {
                                    const column = table.columnsMap.get(key)!;

                                    return (
                                        <TableCell
                                            key={key}
                                            className={
                                                column.align === 'right'
                                                    ? 'text-right'
                                                    : undefined
                                            }
                                        >
                                            {column.render(row)}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </table>
            </div>

            {table.totalRows === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                    {data.length === 0 ? emptyMessage : noResultsMessage}
                </p>
            ) : (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                        Mostrando {(table.page - 1) * table.pageSize + 1}–
                        {Math.min(
                            table.page * table.pageSize,
                            table.totalRows,
                        )}{' '}
                        de {table.totalRows} registros
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-test={`${dataTestPrefix}-page-prev`}
                            disabled={table.page <= 1}
                            onClick={() =>
                                table.setPage((prev) => Math.max(prev - 1, 1))
                            }
                        >
                            <ChevronLeft className="size-4" />
                            Anterior
                        </Button>
                        <span className="text-muted-foreground px-2">
                            Página {table.page} de {table.totalPages}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-test={`${dataTestPrefix}-page-next`}
                            disabled={table.page >= table.totalPages}
                            onClick={() =>
                                table.setPage((prev) =>
                                    Math.min(prev + 1, table.totalPages),
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
    );
}
