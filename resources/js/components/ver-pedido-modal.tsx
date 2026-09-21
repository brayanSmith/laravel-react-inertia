import { usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import VoucherButton from '@/components/voucher-button';
import { useFetchedRecord } from '@/hooks/use-fetched-record';
import {
    currencyFormatter,
    Field,
    formatDate,
    LoadingOrError,
    Section,
    TotalRow,
} from '@/components/record-view';
import { cn } from '@/lib/utils';
import type { Pedido, PedidoRoutes } from '@/types';

type Props = {
    /** The pedido to show, or `null` while the modal is closed. */
    pedido: Pedido | null;
    routes: PedidoRoutes;
    onClose: () => void;
};

type Detalle = {
    id: number;
    cantidad: string;
    precio_unitario: string;
    subtotal: string;
    producto?: {
        concatenar_codigo_nombre: string | null;
        referencia_producto: string | null;
    } | null;
    bodega?: { nombre_bodega: string } | null;
};

type Abono = {
    id: number;
    fecha: string | null;
    monto: string;
    descripcion: string | null;
    puc?: { concatenar_subcuenta_concepto: string | null } | null;
    vendedor?: { name: string } | null;
};

type PedidoDetalleCompleto = Omit<Pedido, 'detalles' | 'abonos'> & {
    tipo_pago?: string | null;
    aplica_turno?: boolean | number | null;
    cliente?: {
        razon_social: string;
        tipo_documento: string | null;
        numero_documento: string | null;
        telefono: string | null;
        ciudad: string | null;
        email: string | null;
        direccion: string | null;
    } | null;
    detalles?: Detalle[];
    abonos?: Abono[];
};

/** Read-only view of a pedido: header, products, payments and totals. */
export default function VerPedidoModal({ pedido, routes, onClose }: Props) {
    const { record, loading, failed } = useFetchedRecord<PedidoDetalleCompleto>(
        pedido ? routes.pedidos.show([pedido.id]) : null,
    );

    const detalles = record?.detalles ?? [];
    const abonos = record?.abonos ?? [];
    return (
        <Dialog
            open={pedido !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent
                className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"
                data-test="ver-pedido-modal"
            >
                <DialogHeader>
                    <DialogTitle>Pedido #{pedido?.id}</DialogTitle>
                    <DialogDescription>
                        Detalle del pedido (solo lectura).
                    </DialogDescription>
                    {pedido && !pedido.deleted_at ? (
                        <div className="pt-1">
                            <VoucherButton
                                action={routes.pedidos.voucher([pedido.id])}
                                label="Descargar voucher"
                                dataTest="ver-pedido-voucher"
                            />
                        </div>
                    ) : null}
                </DialogHeader>

                <LoadingOrError loading={loading} failed={failed} />

                {record ? (
                    <div className="space-y-6">
                        <div className="bg-card grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
                            <Field label="Cliente">
                                {record.cliente?.razon_social}
                            </Field>
                            <Field label="Documento">
                                {[
                                    record.cliente?.tipo_documento,
                                    record.cliente?.numero_documento,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            </Field>
                            <Field label="Teléfono">
                                {record.cliente?.telefono}
                            </Field>
                            <Field label="Fecha">
                                {formatDate(record.fecha)}
                            </Field>
                            <Field label="Bodega">
                                {record.bodega?.nombre_bodega}
                            </Field>
                            <Field label="Vendedor">{record.user?.name}</Field>
                            <Field label="Tipo de precio">
                                {record.tipo_precio}
                            </Field>
                            <Field label="Estado">
                                <Badge
                                    className={cn(
                                        'border-transparent',
                                        record.estado === 'COMPLETADO'
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                                    )}
                                >
                                    {record.estado}
                                </Badge>
                            </Field>
                            <Field label="Estado de pago">
                                <Badge
                                    className={cn(
                                        'border-transparent',
                                        record.estado_pago === 'SALDADO'
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                                    )}
                                >
                                    {record.estado_pago}
                                </Badge>
                            </Field>
                            <Field label="Ciudad">
                                {record.cliente?.ciudad}
                            </Field>
                            <Field label="Email">{record.cliente?.email}</Field>
                            <Field label="Dirección">
                                {record.cliente?.direccion}
                            </Field>
                            <Field label="Tipo de pago">
                                {record.tipo_pago}
                            </Field>
                            <Field label="Facturación electrónica">
                                {record.facturacion_electronica ? 'Sí' : 'No'}
                            </Field>
                            <Field label="Placa">{record.placa}</Field>
                            <Field label="Turno">
                                {record.turno ??
                                    (record.aplica_turno ? 'Aplica' : null)}
                            </Field>
                            <Field
                                label="Observación"
                                className="sm:col-span-3"
                            >
                                {record.observacion}
                            </Field>
                            <Field
                                label="Observación del pago"
                                className="sm:col-span-3"
                            >
                                {record.observacion_pago}
                            </Field>
                        </div>

                        <Section title="Productos">
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Bodega</TableHead>
                                            <TableHead className="text-right">
                                                Cantidad
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Precio unitario
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Subtotal
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detalles.map((detalle) => (
                                            <TableRow key={detalle.id}>
                                                <TableCell>
                                                    {detalle.producto
                                                        ?.concatenar_codigo_nombre ??
                                                        detalle.producto
                                                            ?.referencia_producto ??
                                                        '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {detalle.bodega
                                                        ?.nombre_bodega ??
                                                        record.bodega
                                                            ?.nombre_bodega ??
                                                        '—'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {Number(detalle.cantidad)}
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
                                                        Number(
                                                            detalle.subtotal,
                                                        ),
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Section>

                        {abonos.length > 0 ? (
                            <Section title="Abonos">
                                <div className="overflow-x-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>
                                                    Medio de pago
                                                </TableHead>
                                                <TableHead>Vendedor</TableHead>
                                                <TableHead className="text-right">
                                                    Monto
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {abonos.map((abono) => (
                                                <TableRow key={abono.id}>
                                                    <TableCell>
                                                        {formatDate(
                                                            abono.fecha,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {abono.puc
                                                            ?.concatenar_subcuenta_concepto ??
                                                            '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {abono.vendedor?.name ??
                                                            '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {currencyFormatter.format(
                                                            Number(abono.monto),
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Section>
                        ) : null}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div
                                className="bg-card space-y-1.5 rounded-lg border p-4"
                                data-test="ver-pedido-resumen"
                            >
                                <h3 className="mb-2 text-sm font-semibold">
                                    Resumen
                                </h3>
                                <TotalRow
                                    label="Subtotal"
                                    value={Number(record.subtotal)}
                                />
                                <TotalRow
                                    label="Descuento"
                                    value={Number(record.descuento)}
                                />
                                <TotalRow
                                    label="Flete"
                                    value={Number(record.flete)}
                                />
                                <TotalRow
                                    label="ReteICA"
                                    value={Number(record.reteica)}
                                />
                                <TotalRow
                                    label="ReteFuente"
                                    value={Number(record.retefuente)}
                                />
                                <div className="border-t pt-1.5">
                                    <TotalRow
                                        label="Total a pagar"
                                        value={Number(record.total_a_pagar)}
                                        strong
                                    />
                                </div>
                            </div>

                            <div className="bg-card space-y-1.5 rounded-lg border p-4">
                                <h3 className="mb-2 text-sm font-semibold">
                                    Pago
                                </h3>
                                <TotalRow
                                    label="Abonado"
                                    value={Number(record.abono)}
                                />
                                <TotalRow
                                    label="Saldo pendiente"
                                    value={Number(record.saldo_pendiente)}
                                    strong
                                />
                            </div>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
