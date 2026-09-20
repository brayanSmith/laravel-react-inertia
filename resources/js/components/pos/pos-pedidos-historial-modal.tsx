import { useHttp } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Pagination from '@/components/pagination';
import { descargarVoucher } from '@/components/pos/voucher-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';
import type { RouteDefinition } from '@/wayfinder';
import type {
    LaravelPaginator,
    PosPedidoHistorial,
    PosVoucher,
    VendedorOption,
} from '@/types';

type Query = { desde: string; hasta: string; user_id: string; page: number };

type Props = {
    title: string;
    description?: string;
    /** Builds the GET route to load a page of the history with the filters. */
    buildRoute: (query: Query) => RouteDefinition<'get'>;
    /** Builds the GET route that returns a pedido's voucher data. */
    buildVoucherRoute: (pedidoId: number) => RouteDefinition<'get'>;
    /** Shows the vendedor filter when given. */
    vendedores?: VendedorOption[];
    /** Adds the cliente column (for histories that span several clientes). */
    showCliente?: boolean;
    /** Start with the date range set to today. */
    defaultHoy?: boolean;
    onClose: () => void;
};

/** Today's date (YYYY-MM-DD) in the user's own timezone. */
const hoy = (): string => new Date().toLocaleDateString('en-CA');

const TODOS = 'ALL';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

function formatDate(value: string | null): string {
    return value ? new Date(value).toLocaleDateString('es-CO') : '—';
}

/**
 * Order history for the POS, filterable by date range (and by vendedor when
 * `vendedores` is given). Loaded on demand and paginated on the server.
 * Used for both a single cliente's history and the whole-POS history.
 */
export default function PosPedidosHistorialModal({
    title,
    description,
    buildRoute,
    buildVoucherRoute,
    vendedores,
    showCliente = false,
    defaultHoy = false,
    onClose,
}: Props) {
    const { submit } = useHttp();
    const { submit: submitVoucher } = useHttp();
    const buildRouteRef = useRef(buildRoute);
    buildRouteRef.current = buildRoute;

    const [desde, setDesde] = useState(defaultHoy ? hoy() : '');
    const [hasta, setHasta] = useState(defaultHoy ? hoy() : '');
    const [userId, setUserId] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] =
        useState<LaravelPaginator<PosPedidoHistorial> | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        submit(
            buildRouteRef.current({
                desde,
                hasta,
                user_id: userId,
                page,
            }),
        )
            .then((response) => {
                if (!cancelled) {
                    setData(response as LaravelPaginator<PosPedidoHistorial>);
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
    }, [desde, hasta, userId, page]);

    const [descargando, setDescargando] = useState<number | null>(null);

    const descargar = async (pedidoId: number) => {
        setDescargando(pedidoId);

        try {
            const voucher = (await submitVoucher(
                buildVoucherRoute(pedidoId),
            )) as PosVoucher;

            await descargarVoucher(voucher);
        } catch {
            toast.error('No se pudo descargar el voucher.');
        } finally {
            setDescargando(null);
        }
    };

    const changeFilter =
        (setter: (value: string) => void) => (value: string) => {
            setter(value);
            setPage(1);
        };

    const hasFilters = Boolean(desde || hasta || userId);
    const pedidos = data?.data ?? [];
    const columns = 9 + (showCliente ? 1 : 0);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="flex max-h-[85vh] flex-col sm:max-w-5xl"
                data-test="pos-historial-modal"
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? (
                        <DialogDescription>{description}</DialogDescription>
                    ) : null}
                </DialogHeader>

                <div className="flex flex-wrap items-end gap-3">
                    <div className="grid gap-1">
                        <Label htmlFor="historial-desde">Desde</Label>
                        <Input
                            id="historial-desde"
                            type="date"
                            value={desde}
                            max={hasta || undefined}
                            onChange={(event) =>
                                changeFilter(setDesde)(event.target.value)
                            }
                            data-test="pos-historial-desde"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="historial-hasta">Hasta</Label>
                        <Input
                            id="historial-hasta"
                            type="date"
                            value={hasta}
                            min={desde || undefined}
                            onChange={(event) =>
                                changeFilter(setHasta)(event.target.value)
                            }
                            data-test="pos-historial-hasta"
                        />
                    </div>

                    {vendedores ? (
                        <div className="grid gap-1">
                            <Label>Vendedor</Label>
                            <Select
                                value={userId === '' ? TODOS : userId}
                                onValueChange={(value) =>
                                    changeFilter(setUserId)(
                                        value === TODOS ? '' : value,
                                    )
                                }
                            >
                                <SelectTrigger
                                    className="w-48"
                                    data-test="pos-historial-vendedor"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TODOS}>Todos</SelectItem>
                                    {vendedores.map((vendedor) => (
                                        <SelectItem
                                            key={vendedor.id}
                                            value={String(vendedor.id)}
                                        >
                                            {vendedor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}

                    {hasFilters ? (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setDesde('');
                                setHasta('');
                                setUserId('');
                                setPage(1);
                            }}
                        >
                            Limpiar
                        </Button>
                    ) : null}
                </div>

                <div
                    className={cn(
                        'overflow-auto rounded-md border',
                        loading && 'opacity-60',
                    )}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Fecha</TableHead>
                                {showCliente ? (
                                    <TableHead>Cliente</TableHead>
                                ) : null}
                                <TableHead>Vendedor</TableHead>
                                <TableHead>Productos</TableHead>
                                <TableHead>Pago</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">
                                    Total
                                </TableHead>
                                <TableHead className="text-right">
                                    Saldo
                                </TableHead>
                                <TableHead className="text-right">
                                    Voucher
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pedidos.map((pedido) => (
                                <TableRow
                                    key={pedido.id}
                                    data-test="pos-historial-row"
                                >
                                    <TableCell>{pedido.id}</TableCell>
                                    <TableCell>
                                        {formatDate(pedido.fecha)}
                                    </TableCell>
                                    {showCliente ? (
                                        <TableCell>
                                            {pedido.cliente ?? '—'}
                                        </TableCell>
                                    ) : null}
                                    <TableCell>
                                        {pedido.vendedor ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <ul className="list-disc pl-4 text-xs">
                                            {pedido.productos.map(
                                                (producto, index) => (
                                                    <li key={index}>
                                                        {producto}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </TableCell>
                                    <TableCell>{pedido.tipo_pago}</TableCell>
                                    <TableCell>
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
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {currencyFormatter.format(
                                            Number(pedido.total_a_pagar),
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {currencyFormatter.format(
                                            Number(pedido.saldo_pendiente),
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            title="Descargar voucher"
                                            disabled={descargando === pedido.id}
                                            onClick={() => descargar(pedido.id)}
                                            data-test="pos-historial-voucher"
                                        >
                                            <Download className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {!loading && pedidos.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns}
                                        className="text-muted-foreground py-8 text-center"
                                    >
                                        No hay pedidos
                                        {hasFilters ? ' con esos filtros' : ''}.
                                    </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                </div>

                {data && data.last_page > 1 ? (
                    <Pagination
                        page={data.current_page}
                        totalPages={data.last_page}
                        onPageChange={setPage}
                        dataTest="pos-historial-page"
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
