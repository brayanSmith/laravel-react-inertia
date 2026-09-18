import { Link, useHttp, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    ExternalLink,
    Image as ImageIcon,
    Ruler,
    Warehouse,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { edit as editCompra } from '@/routes/compras';
import { edit as editPedido } from '@/routes/pedidos';
import { detalles } from '@/routes/productos';
import type {
    Bodega,
    Producto,
    ProductoDetalleCompra,
    ProductoDetallePedido,
    ProductoDetallesResponse,
} from '@/types';

type Props = {
    producto: Producto | null;
    bodegas: Bodega[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type SortDirection = 'asc' | 'desc';

type PedidoSortKey =
    | 'id'
    | 'fecha'
    | 'cliente'
    | 'cantidad'
    | 'precio_unitario'
    | 'subtotal';

type CompraSortKey =
    | 'id'
    | 'fecha'
    | 'factura'
    | 'proveedor'
    | 'bodega'
    | 'cantidad'
    | 'precio_unitario'
    | 'subtotal';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatDate(value: string | null | undefined): string {
    return value ? new Date(value).toLocaleDateString('es-CO') : '—';
}

function pedidoSortValue(
    detalle: ProductoDetallePedido,
    key: PedidoSortKey,
): string | number {
    switch (key) {
        case 'id':
            return detalle.pedido_id;
        case 'fecha':
            return detalle.pedido?.fecha
                ? new Date(detalle.pedido.fecha).getTime()
                : 0;
        case 'cliente':
            return detalle.pedido?.cliente?.razon_social ?? '';
        case 'cantidad':
            return Number(detalle.cantidad);
        case 'precio_unitario':
            return Number(detalle.precio_unitario);
        case 'subtotal':
            return Number(detalle.subtotal);
    }
}

function compraSortValue(
    detalle: ProductoDetalleCompra,
    key: CompraSortKey,
): string | number {
    switch (key) {
        case 'id':
            return detalle.compra_id;
        case 'fecha':
            return detalle.compra?.fecha
                ? new Date(detalle.compra.fecha).getTime()
                : 0;
        case 'factura':
            return detalle.compra?.factura ?? '';
        case 'proveedor':
            return detalle.compra?.proveedor?.nombre_proveedor ?? '';
        case 'bodega':
            return detalle.bodega?.nombre_bodega ?? '';
        case 'cantidad':
            return Number(detalle.cantidad);
        case 'precio_unitario':
            return Number(detalle.precio_unitario);
        case 'subtotal':
            return Number(detalle.subtotal);
    }
}

function sortRows<T, K extends string>(
    rows: T[],
    sort: { key: K; direction: SortDirection } | null,
    getValue: (row: T, key: K) => string | number,
): T[] {
    if (!sort) {
        return rows;
    }

    const sorted = [...rows].sort((a, b) => {
        const valueA = getValue(a, sort.key);
        const valueB = getValue(b, sort.key);

        const comparison =
            typeof valueA === 'number' && typeof valueB === 'number'
                ? valueA - valueB
                : String(valueA).localeCompare(String(valueB), 'es', {
                      sensitivity: 'base',
                  });

        return sort.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
}

function InfoBadge({
    value,
    colorClassName,
}: {
    value: number;
    colorClassName: string;
}) {
    return (
        <Badge className={cn('border-transparent', colorClassName)}>
            {value}
        </Badge>
    );
}

function ValueBadge({ value }: { value: number }) {
    const has = value > 0;

    return (
        <InfoBadge
            value={value}
            colorClassName={
                has
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-red-100 text-red-700 hover:bg-red-100'
            }
        />
    );
}

function Field({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    return (
        <div className="grid gap-0.5">
            <span className="text-muted-foreground text-xs">{label}</span>
            <span className="text-sm font-medium">{value ?? '—'}</span>
        </div>
    );
}

function PrecioField({
    label,
    value,
    colorClassName,
}: {
    label: string;
    value: number;
    colorClassName: string;
}) {
    return (
        <div className="grid gap-0.5">
            <span className="text-muted-foreground text-xs">{label}</span>
            <span className={cn('text-lg font-semibold', colorClassName)}>
                {decimalFormatter.format(value)}
            </span>
        </div>
    );
}

function SectionCard({
    icon: Icon,
    title,
    children,
}: {
    icon: typeof Ruler;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
                <Icon className="size-4" />
                <span className="text-foreground">{title}</span>
            </div>
            {children}
        </div>
    );
}

function SortableHeadCell<K extends string>({
    label,
    columnKey,
    align,
    sort,
    onSort,
}: {
    label: string;
    columnKey: K;
    align?: 'right';
    sort: { key: K; direction: SortDirection } | null;
    onSort: (key: K) => void;
}) {
    const active = sort?.key === columnKey;
    const Icon = active
        ? sort?.direction === 'asc'
            ? ArrowUp
            : ArrowDown
        : ArrowUpDown;

    return (
        <TableHead className={align === 'right' ? 'text-right' : undefined}>
            <button
                type="button"
                onClick={() => onSort(columnKey)}
                className={cn(
                    'hover:text-foreground inline-flex items-center gap-1',
                    align === 'right' && 'flex-row-reverse',
                    active ? 'text-foreground' : 'text-muted-foreground',
                )}
            >
                {label}
                <Icon className="size-3.5" />
            </button>
        </TableHead>
    );
}

function PaginationBar({
    page,
    lastPage,
    total,
    loading,
    onChange,
}: {
    page: number;
    lastPage: number;
    total: number;
    loading: boolean;
    onChange: (page: number) => void;
}) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{total} registros</span>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => onChange(Math.max(page - 1, 1))}
                >
                    <ChevronLeft className="size-3.5" />
                    Anterior
                </Button>
                <span className="text-muted-foreground px-1">
                    Página {page} de {Math.max(lastPage, 1)}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= lastPage || loading}
                    onClick={() => onChange(Math.min(page + 1, lastPage))}
                >
                    Siguiente
                    <ChevronRight className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}

export default function ProductoDetalleModal({
    producto,
    bodegas,
    open,
    onOpenChange,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const { submit } = useHttp();

    const [pedidosPage, setPedidosPage] = useState(1);
    const [comprasPage, setComprasPage] = useState(1);
    const [data, setData] = useState<ProductoDetallesResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [pedidosSort, setPedidosSort] = useState<{
        key: PedidoSortKey;
        direction: SortDirection;
    } | null>(null);
    const [comprasSort, setComprasSort] = useState<{
        key: CompraSortKey;
        direction: SortDirection;
    } | null>(null);

    useEffect(() => {
        if (open) {
            setPedidosPage(1);
            setComprasPage(1);
            setPedidosSort(null);
            setComprasSort(null);
            setData(null);
        }
    }, [open, producto?.id]);

    useEffect(() => {
        if (!open || !producto) {
            return;
        }

        let cancelled = false;
        setLoading(true);

        submit(
            detalles([teamSlug, producto.id], {
                query: {
                    pedidos_page: pedidosPage,
                    compras_page: comprasPage,
                },
            }),
        )
            .then((response) => {
                if (!cancelled) {
                    setData(response as ProductoDetallesResponse);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setData(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, producto, pedidosPage, comprasPage, teamSlug]);

    const sortedPedidos = useMemo(
        () =>
            sortRows(
                data?.detallePedidos.data ?? [],
                pedidosSort,
                pedidoSortValue,
            ),
        [data, pedidosSort],
    );

    const sortedCompras = useMemo(
        () =>
            sortRows(
                data?.detalleCompras.data ?? [],
                comprasSort,
                compraSortValue,
            ),
        [data, comprasSort],
    );

    const handlePedidosSort = (key: PedidoSortKey) => {
        setPedidosSort((prev) =>
            prev?.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    const handleComprasSort = (key: CompraSortKey) => {
        setComprasSort((prev) =>
            prev?.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    if (!producto) {
        return null;
    }

    const nombre = producto.concatenar_codigo_nombre || 'Producto';
    const detallePedidos = data?.detallePedidos;
    const detalleCompras = data?.detalleCompras;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>{nombre}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <SectionCard icon={ImageIcon} title="Imagen producto">
                            <div className="flex gap-4">
                                <div className="bg-muted h-28 w-28 shrink-0 overflow-hidden rounded-md border">
                                    {producto.imagen_producto_url ? (
                                        <img
                                            src={producto.imagen_producto_url}
                                            alt={nombre}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                                            Sin imagen
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Field label="Producto" value={nombre} />
                                    {producto.marca ? (
                                        <div className="grid gap-0.5">
                                            <span className="text-muted-foreground text-xs">
                                                Marca
                                            </span>
                                            <Badge variant="secondary">
                                                {producto.marca.marca}
                                            </Badge>
                                        </div>
                                    ) : null}
                                    <div className="flex flex-wrap gap-4">
                                        <div className="grid gap-0.5">
                                            <span className="text-muted-foreground text-xs">
                                                Categoría
                                            </span>
                                            <Badge variant="secondary">
                                                {producto.categoria ?? '—'}
                                            </Badge>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <span className="text-muted-foreground text-xs">
                                                Tipo
                                            </span>
                                            <Badge variant="secondary">
                                                {producto.tipo ?? '—'}
                                            </Badge>
                                        </div>
                                        {producto.tipo_vehiculo ? (
                                            <div className="grid gap-0.5">
                                                <span className="text-muted-foreground text-xs">
                                                    Vehículo
                                                </span>
                                                <Badge className="border-transparent bg-amber-100 text-amber-700 hover:bg-amber-100">
                                                    {producto.tipo_vehiculo}
                                                </Badge>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard icon={Ruler} title="Medidas">
                            <div className="grid grid-cols-4 gap-4">
                                <Field label="Ancho" value={producto.ancho} />
                                <Field
                                    label="Perfil"
                                    value={producto.perfil}
                                />
                                <Field
                                    label="Construcción"
                                    value={producto.construccion}
                                />
                                <Field label="Rin" value={producto.rin} />
                            </div>
                        </SectionCard>

                        <SectionCard icon={DollarSign} title="Precios">
                            <div className="grid grid-cols-4 gap-4">
                                <PrecioField
                                    label="Costo"
                                    value={Number(producto.costo_producto)}
                                    colorClassName="text-blue-600 dark:text-blue-400"
                                />
                                <PrecioField
                                    label="Detal"
                                    value={Number(producto.valor_detal)}
                                    colorClassName="text-emerald-600 dark:text-emerald-400"
                                />
                                <PrecioField
                                    label="Mayorista"
                                    value={Number(producto.valor_mayorista)}
                                    colorClassName="text-amber-600 dark:text-amber-400"
                                />
                                <PrecioField
                                    label="Sin Instalación"
                                    value={Number(
                                        producto.valor_sin_instalacion,
                                    )}
                                    colorClassName="text-red-600 dark:text-red-400"
                                />
                            </div>
                        </SectionCard>

                        <SectionCard icon={Warehouse} title="Stock por bodega">
                            <div className="flex flex-wrap gap-4">
                                <div className="grid gap-1">
                                    <span className="text-muted-foreground text-xs">
                                        Stock Total
                                    </span>
                                    <ValueBadge
                                        value={producto.stock_total ?? 0}
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <span className="text-muted-foreground text-xs">
                                        Cantidad Comprada
                                    </span>
                                    <InfoBadge
                                        value={data?.totalComprado ?? 0}
                                        colorClassName="bg-blue-100 text-blue-700 hover:bg-blue-100"
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <span className="text-muted-foreground text-xs">
                                        Cantidad Vendida
                                    </span>
                                    <InfoBadge
                                        value={data?.totalVendido ?? 0}
                                        colorClassName="bg-blue-100 text-blue-700 hover:bg-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {bodegas.map((bodega) => (
                                    <div key={bodega.id} className="grid gap-1">
                                        <span className="text-muted-foreground truncate text-xs">
                                            {bodega.nombre_bodega}
                                        </span>
                                        <ValueBadge
                                            value={
                                                producto.stock_por_bodega?.[
                                                    bodega.id
                                                ] ?? 0
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">
                            Pedidos con este producto
                        </h3>
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableHeadCell
                                            label="ID"
                                            columnKey="id"
                                            sort={pedidosSort}
                                            onSort={handlePedidosSort}
                                        />
                                        <SortableHeadCell
                                            label="Fecha"
                                            columnKey="fecha"
                                            sort={pedidosSort}
                                            onSort={handlePedidosSort}
                                        />
                                        <SortableHeadCell
                                            label="Cliente"
                                            columnKey="cliente"
                                            sort={pedidosSort}
                                            onSort={handlePedidosSort}
                                        />
                                        <SortableHeadCell
                                            label="Cantidad"
                                            columnKey="cantidad"
                                            align="right"
                                            sort={pedidosSort}
                                            onSort={handlePedidosSort}
                                        />
                                        <SortableHeadCell
                                            label="Precio unitario"
                                            columnKey="precio_unitario"
                                            align="right"
                                            sort={pedidosSort}
                                            onSort={handlePedidosSort}
                                        />
                                        <SortableHeadCell
                                            label="Subtotal"
                                            columnKey="subtotal"
                                            align="right"
                                            sort={pedidosSort}
                                            onSort={handlePedidosSort}
                                        />
                                        <TableHead className="text-right">
                                            Acciones
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedPedidos.map((detalle) => (
                                        <TableRow
                                            key={detalle.id}
                                            data-test="producto-detalle-pedido-row"
                                        >
                                            <TableCell>
                                                {detalle.pedido_id}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    detalle.pedido?.fecha,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {detalle.pedido?.cliente
                                                    ?.razon_social ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {detalle.cantidad}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {currencyFormatter.format(
                                                    Number(
                                                        detalle.precio_unitario,
                                                    ),
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {currencyFormatter.format(
                                                    Number(detalle.subtotal),
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    data-test="producto-detalle-pedido-link"
                                                >
                                                    <Link
                                                        href={editPedido([
                                                            teamSlug,
                                                            detalle.pedido_id,
                                                        ])}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Ver pedido
                                                        <ExternalLink className="size-3.5" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {!loading && sortedPedidos.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-muted-foreground py-6 text-center"
                                            >
                                                Este producto no tiene
                                                pedidos registrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                </TableBody>
                            </Table>
                        </div>

                        {detallePedidos && detallePedidos.data.length > 0 ? (
                            <PaginationBar
                                page={detallePedidos.current_page}
                                lastPage={detallePedidos.last_page}
                                total={detallePedidos.total}
                                loading={loading}
                                onChange={setPedidosPage}
                            />
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">
                            Compras con este producto
                        </h3>
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableHeadCell
                                            label="ID"
                                            columnKey="id"
                                            sort={comprasSort}
                                            onSort={handleComprasSort}
                                        />
                                        <SortableHeadCell
                                            label="Fecha"
                                            columnKey="fecha"
                                            sort={comprasSort}
                                            onSort={handleComprasSort}
                                        />
                                        <SortableHeadCell
                                            label="Factura"
                                            columnKey="factura"
                                            sort={comprasSort}
                                            onSort={handleComprasSort}
                                        />
                                        <SortableHeadCell
                                            label="Proveedor"
                                            columnKey="proveedor"
                                            sort={comprasSort}
                                            onSort={handleComprasSort}
                                        />
                                        <SortableHeadCell
                                            label="Bodega"
                                            columnKey="bodega"
                                            sort={comprasSort}
                                            onSort={handleComprasSort}
                                        />
                                        <SortableHeadCell
                                            label="Cantidad"
                                            columnKey="cantidad"
                                            align="right"
                                            sort={comprasSort}
                                            onSort={handleComprasSort}
                                        />
                                        <SortableHeadCell
                                            label="Precio unitario"
                                            columnKey="precio_unitario"
                                            align="right"
                                            sort={comprasSort}
                                            onSort={handleComprasSort}
                                        />
                                        <SortableHeadCell
                                            label="Subtotal"
                                            columnKey="subtotal"
                                            align="right"
                                            sort={comprasSort}
                                            onSort={handleComprasSort}
                                        />
                                        <TableHead className="text-right">
                                            Acciones
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCompras.map((detalle) => (
                                        <TableRow
                                            key={detalle.id}
                                            data-test="producto-detalle-compra-row"
                                        >
                                            <TableCell>
                                                {detalle.compra_id}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    detalle.compra?.fecha,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {detalle.compra?.factura ??
                                                    '—'}
                                            </TableCell>
                                            <TableCell>
                                                {detalle.compra?.proveedor
                                                    ?.nombre_proveedor ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                {detalle.bodega
                                                    ?.nombre_bodega ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {detalle.cantidad}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {currencyFormatter.format(
                                                    Number(
                                                        detalle.precio_unitario,
                                                    ),
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {currencyFormatter.format(
                                                    Number(detalle.subtotal),
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    data-test="producto-detalle-compra-link"
                                                >
                                                    <Link
                                                        href={editCompra([
                                                            teamSlug,
                                                            detalle.compra_id,
                                                        ])}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Ver compra
                                                        <ExternalLink className="size-3.5" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {!loading && sortedCompras.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="text-muted-foreground py-6 text-center"
                                            >
                                                Este producto no tiene
                                                compras registradas.
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                </TableBody>
                            </Table>
                        </div>

                        {detalleCompras && detalleCompras.data.length > 0 ? (
                            <PaginationBar
                                page={detalleCompras.current_page}
                                lastPage={detalleCompras.last_page}
                                total={detalleCompras.total}
                                loading={loading}
                                onChange={setComprasPage}
                            />
                        ) : null}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
