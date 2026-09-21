import { Fragment, useMemo, useState } from 'react';
import { useTiposPrecio } from '@/hooks/use-tipos-precio';
import type { ReactNode } from 'react';

import Combobox from '@/components/combobox';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { precioParaTipo } from '@/lib/pedido-pricing';
import { cn } from '@/lib/utils';
import type {
    BodegaOption,
    ClienteOption,
    Pedido,
    PedidoEditPermissions,
    ProductoPedidoOption,
    TipoPrecioPedido,
    VendedorOption,
} from '@/types';

type FormErrors = Partial<Record<string, string>>;

type Props = {
    pedido?: Pedido | null;
    /** Edit form only: what the user may change. Omitted on create (everything allowed). */
    permissions?: PedidoEditPermissions;
    clientes: ClienteOption[];
    productos: ProductoPedidoOption[];
    bodegas: BodegaOption[];
    vendedores: VendedorOption[];
    errors: FormErrors;
    actions?: ReactNode;
    /** Initial "Tipo Precio" for a new pedido (e.g. the mayorista module defaults to MAYORISTA). */
    defaultTipoPrecio?: TipoPrecioPedido;
};

type DetalleRow = {
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function toDatetimeLocal(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function productoLabel(producto: ProductoPedidoOption): string {
    return (
        producto.concatenar_codigo_nombre ??
        producto.referencia_producto ??
        `Producto ${producto.id}`
    );
}

export default function PedidoFormFields({
    pedido,
    permissions,
    clientes,
    productos,
    bodegas,
    vendedores,
    errors,
    actions,
    defaultTipoPrecio = 'DETAL',
}: Props) {
    const clienteMap = useMemo(
        () => new Map(clientes.map((cliente) => [cliente.id, cliente])),
        [clientes],
    );
    const productoMap = useMemo(
        () => new Map(productos.map((producto) => [producto.id, producto])),
        [productos],
    );

    const clienteOptions = useMemo(
        () =>
            clientes.map((cliente) => ({
                value: String(cliente.id),
                label: cliente.razon_social,
            })),
        [clientes],
    );
    const vendedorOptions = useMemo(
        () =>
            vendedores.map((vendedor) => ({
                value: String(vendedor.id),
                label: vendedor.name,
            })),
        [vendedores],
    );
    const bodegaOptions = useMemo(
        () =>
            bodegas.map((bodega) => ({
                value: String(bodega.id),
                label: bodega.nombre_bodega,
            })),
        [bodegas],
    );
    const productoOptions = useMemo(
        () =>
            productos.map((producto) => ({
                value: String(producto.id),
                label: productoLabel(producto),
            })),
        [productos],
    );

    const [clienteId, setClienteId] = useState<string>(
        pedido?.cliente_id ? String(pedido.cliente_id) : '',
    );
    const [vendedorId, setVendedorId] = useState<string>(
        pedido?.user_id ? String(pedido.user_id) : '',
    );
    const [bodegaId, setBodegaId] = useState<string>(
        pedido?.bodega_id ? String(pedido.bodega_id) : '',
    );
    const { tiposPedido } = useTiposPrecio();
    const [tipoPrecio, setTipoPrecio] = useState<TipoPrecioPedido>(
        pedido?.tipo_precio ??
            (tiposPedido.includes(defaultTipoPrecio)
                ? defaultTipoPrecio
                : (tiposPedido[0] ?? defaultTipoPrecio)),
    );
    // What the user may pick, plus the tipo the pedido already has.
    const tiposDisponibles = new Set<TipoPrecioPedido>([
        ...tiposPedido,
        tipoPrecio,
    ]);
    const [facturacionElectronica, setFacturacionElectronica] =
        useState<boolean>(pedido?.facturacion_electronica ?? false);
    const [flete, setFlete] = useState<string>(pedido?.flete ?? '0');
    const [descuento, setDescuento] = useState<string>(
        pedido?.descuento ?? '0',
    );
    const [reteica, setReteica] = useState<string>(pedido?.reteica ?? '0');
    const [retefuente, setRetefuente] = useState<string>(
        pedido?.retefuente ?? '0',
    );

    const [rows, setRows] = useState<DetalleRow[]>(
        (pedido?.detalles ?? []).map((detalle) => ({
            producto_id: detalle.producto_id,
            cantidad: Number(detalle.cantidad),
            precio_unitario: Number(detalle.precio_unitario),
        })),
    );

    const [selectedProductoId, setSelectedProductoId] = useState<string>('');
    const [cantidad, setCantidad] = useState<string>('');
    const [precioUnitario, setPrecioUnitario] = useState<string>('');

    const resetAddRow = () => {
        setSelectedProductoId('');
        setCantidad('');
        setPrecioUnitario('');
    };

    const handleSelectProducto = (value: string) => {
        setSelectedProductoId(value);

        const producto = productoMap.get(Number(value));

        if (producto) {
            setPrecioUnitario(String(precioParaTipo(producto, tipoPrecio)));
        }
    };

    const puedeEditarDatos = permissions?.canUpdateDatos ?? true;
    const puedeAgregarProductos = permissions?.canCreateDetalle ?? true;
    const puedeEditarProductos = permissions?.canUpdateDetalle ?? true;
    const puedeEliminarProductos = permissions?.canDeleteDetalle ?? true;
    const productosOriginales = new Set(
        (pedido?.detalles ?? []).map((detalle) => detalle.producto_id),
    );

    const subtotalAddRow =
        (Number(cantidad) || 0) * (Number(precioUnitario) || 0);
    // Without "agregar productos" the add row only puts back a product
    // the pedido already had (that is how a line is edited).
    const canAgregar =
        Boolean(selectedProductoId) &&
        Number(cantidad) > 0 &&
        (puedeAgregarProductos ||
            productosOriginales.has(Number(selectedProductoId)));

    const handleAgregar = () => {
        if (!canAgregar) {
            return;
        }

        const productoId = Number(selectedProductoId);

        setRows((prev) => [
            ...prev.filter((row) => row.producto_id !== productoId),
            {
                producto_id: productoId,
                cantidad: Number(cantidad),
                precio_unitario: Number(precioUnitario) || 0,
            },
        ]);
        resetAddRow();
    };

    const handleEditarFila = (row: DetalleRow) => {
        setSelectedProductoId(String(row.producto_id));
        setCantidad(String(row.cantidad));
        setPrecioUnitario(String(row.precio_unitario));
        setRows((prev) =>
            prev.filter((r) => r.producto_id !== row.producto_id),
        );
    };

    const handleEliminarFila = (productoId: number) => {
        setRows((prev) => prev.filter((row) => row.producto_id !== productoId));
    };

    const subtotalGeneral = useMemo(
        () =>
            rows.reduce(
                (sum, row) => sum + row.cantidad * row.precio_unitario,
                0,
            ),
        [rows],
    );

    const totalGeneral = Math.max(
        subtotalGeneral +
            (Number(flete) || 0) -
            (Number(descuento) || 0) -
            (Number(reteica) || 0) -
            (Number(retefuente) || 0),
        0,
    );

    const clienteSeleccionado = clienteId
        ? clienteMap.get(Number(clienteId))
        : null;

    const estadoPedido = pedido?.estado ?? 'PENDIENTE';

    return (
        <div className="space-y-6">
            <div className="bg-card space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                    <div className="font-semibold">
                        Datos Generales del Pedido
                    </div>
                    <Badge
                        className={cn(
                            'border-transparent',
                            estadoPedido === 'COMPLETADO'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                        )}
                    >
                        {estadoPedido}
                    </Badge>
                </div>

                <div
                    inert={!puedeEditarDatos}
                    className={cn(
                        'space-y-4',
                        !puedeEditarDatos && 'opacity-60',
                    )}
                    data-test="pedido-datos-generales"
                >
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label>Cliente</Label>
                            <Combobox
                                options={clienteOptions}
                                value={clienteId}
                                onValueChange={setClienteId}
                                searchPlaceholder="Buscar cliente..."
                                emptyText="No se encontraron clientes."
                                dataTest="pedido-cliente"
                            />
                            <input
                                type="hidden"
                                name="cliente_id"
                                value={clienteId}
                            />
                            <InputError message={errors.cliente_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="fecha">Fecha</Label>
                            <Input
                                id="fecha"
                                name="fecha"
                                type="datetime-local"
                                data-test="pedido-fecha"
                                defaultValue={toDatetimeLocal(
                                    pedido?.fecha ?? new Date().toISOString(),
                                )}
                                required
                            />
                            <InputError message={errors.fecha} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Vendedor</Label>
                            <Combobox
                                options={vendedorOptions}
                                value={vendedorId}
                                onValueChange={setVendedorId}
                                searchPlaceholder="Buscar vendedor..."
                                emptyText="No se encontraron vendedores."
                                dataTest="pedido-vendedor"
                            />
                            <input
                                type="hidden"
                                name="user_id"
                                value={vendedorId}
                            />
                            <InputError message={errors.user_id} />
                        </div>
                    </div>

                    {clienteSeleccionado ? (
                        <div className="rounded-md bg-blue-50 p-3 text-sm dark:bg-blue-950/40">
                            <div className="mb-1 text-center text-xs font-semibold tracking-wide text-blue-700 dark:text-blue-300">
                                DATOS DEL CLIENTE
                            </div>
                            <div className="grid gap-2 sm:grid-cols-4">
                                <div>
                                    <span className="text-muted-foreground">
                                        Documento:{' '}
                                    </span>
                                    {clienteSeleccionado.numero_documento ??
                                        '—'}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">
                                        Teléfono:{' '}
                                    </span>
                                    {clienteSeleccionado.telefono ?? '—'}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">
                                        Ciudad:{' '}
                                    </span>
                                    {clienteSeleccionado.ciudad ?? '—'}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">
                                        Email:{' '}
                                    </span>
                                    {clienteSeleccionado.email ?? '—'}
                                </div>
                                <div className="sm:col-span-4">
                                    <span className="text-muted-foreground">
                                        Dirección:{' '}
                                    </span>
                                    {clienteSeleccionado.direccion ?? '—'}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-4">
                        <div className="grid gap-2">
                            <Label htmlFor="placa">Placa</Label>
                            <Input
                                id="placa"
                                name="placa"
                                data-test="pedido-placa"
                                defaultValue={pedido?.placa ?? ''}
                            />
                            <InputError message={errors.placa} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Tipo Precio</Label>
                            <Select
                                value={tipoPrecio}
                                onValueChange={(value) =>
                                    setTipoPrecio(value as TipoPrecioPedido)
                                }
                            >
                                <SelectTrigger
                                    className="w-full"
                                    data-test="pedido-tipo-precio"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposDisponibles.has('DETAL') ? (
                                        <SelectItem value="DETAL">
                                            DETAL
                                        </SelectItem>
                                    ) : null}
                                    {tiposDisponibles.has('MAYORISTA') ? (
                                        <SelectItem value="MAYORISTA">
                                            MAYORISTA
                                        </SelectItem>
                                    ) : null}
                                    {tiposDisponibles.has('OTRO') ? (
                                        <SelectItem value="OTRO">
                                            OTRO
                                        </SelectItem>
                                    ) : null}
                                </SelectContent>
                            </Select>
                            <input
                                type="hidden"
                                name="tipo_precio"
                                value={tipoPrecio}
                            />
                            <InputError message={errors.tipo_precio} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Bodega</Label>
                            <Combobox
                                options={bodegaOptions}
                                value={bodegaId}
                                onValueChange={setBodegaId}
                                searchPlaceholder="Buscar bodega..."
                                emptyText="No se encontraron bodegas."
                                dataTest="pedido-bodega"
                            />
                            <input
                                type="hidden"
                                name="bodega_id"
                                value={bodegaId}
                            />
                            <InputError message={errors.bodega_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="facturacion_electronica">
                                Facturación Electrónica
                            </Label>
                            <div className="flex h-9 items-center">
                                <Switch
                                    id="facturacion_electronica"
                                    data-test="pedido-facturacion-electronica"
                                    checked={facturacionElectronica}
                                    onCheckedChange={setFacturacionElectronica}
                                />
                            </div>
                            <input
                                type="hidden"
                                name="facturacion_electronica"
                                value={facturacionElectronica ? '1' : '0'}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="observacion">Observación</Label>
                        <Textarea
                            id="observacion"
                            name="observacion"
                            data-test="pedido-observacion"
                            defaultValue={pedido?.observacion ?? ''}
                        />
                        <InputError message={errors.observacion} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="observacion_pago">
                            Observación Pago
                        </Label>
                        <Textarea
                            id="observacion_pago"
                            name="observacion_pago"
                            data-test="pedido-observacion-pago"
                            defaultValue={pedido?.observacion_pago ?? ''}
                        />
                        <InputError message={errors.observacion_pago} />
                    </div>
                </div>
            </div>

            <div className="bg-card overflow-x-auto rounded-lg border">
                <Table className="[&_tr]:divide-x">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-center">
                                Cantidad
                            </TableHead>
                            <TableHead className="text-center">
                                Precio Unitario
                            </TableHead>
                            <TableHead className="text-center">
                                Subtotal
                            </TableHead>
                            <TableHead className="text-center">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {puedeAgregarProductos || puedeEditarProductos ? (
                            <TableRow>
                                <TableCell>
                                    <Combobox
                                        options={productoOptions}
                                        value={selectedProductoId}
                                        onValueChange={handleSelectProducto}
                                        placeholder="Seleccione un producto..."
                                        searchPlaceholder="Buscar producto..."
                                        emptyText="No se encontraron productos."
                                        dataTest="pedido-producto-select"
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        className="mx-auto w-24 text-center"
                                        value={cantidad}
                                        onChange={(event) =>
                                            setCantidad(event.target.value)
                                        }
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        className="mx-auto w-32 text-center"
                                        value={precioUnitario}
                                        onChange={(event) =>
                                            setPrecioUnitario(
                                                event.target.value,
                                            )
                                        }
                                    />
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                    {currencyFormatter.format(subtotalAddRow)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        type="button"
                                        size="sm"
                                        data-test="pedido-agregar-detalle"
                                        disabled={!canAgregar}
                                        onClick={handleAgregar}
                                    >
                                        + Agregar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
            </div>
            <InputError message={errors.detalles} />

            <div className="bg-card space-y-4 rounded-lg border p-4">
                <div className="font-semibold">Detalle del Pedido</div>

                <div className="overflow-x-auto">
                    <Table className="[&_tr]:divide-x">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-center">
                                    Cantidad
                                </TableHead>
                                <TableHead className="text-center">
                                    Precio Unitario
                                </TableHead>
                                <TableHead className="text-center">
                                    Subtotal
                                </TableHead>
                                <TableHead className="text-center">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => {
                                const producto = productoMap.get(
                                    row.producto_id,
                                );

                                return (
                                    <TableRow
                                        key={row.producto_id}
                                        data-test="pedido-detalle-row"
                                    >
                                        <TableCell>
                                            {producto
                                                ? productoLabel(producto)
                                                : `Producto ${row.producto_id}`}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {row.cantidad}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {currencyFormatter.format(
                                                row.precio_unitario,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {currencyFormatter.format(
                                                row.cantidad *
                                                    row.precio_unitario,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                {puedeEditarProductos ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        data-test="pedido-editar-detalle"
                                                        onClick={() =>
                                                            handleEditarFila(
                                                                row,
                                                            )
                                                        }
                                                    >
                                                        Editar
                                                    </Button>
                                                ) : null}
                                                {puedeEliminarProductos ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        data-test="pedido-eliminar-detalle"
                                                        onClick={() =>
                                                            handleEliminarFila(
                                                                row.producto_id,
                                                            )
                                                        }
                                                    >
                                                        Eliminar
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {rows.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">
                        Aún no hay productos agregados al pedido.
                    </p>
                ) : (
                    <div className="flex justify-center">
                        <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Productos: {rows.length}
                        </Badge>
                    </div>
                )}
            </div>

            {rows.map((row, index) => (
                <Fragment key={row.producto_id}>
                    <input
                        type="hidden"
                        name={`detalles[${index}][producto_id]`}
                        value={row.producto_id}
                    />
                    <input
                        type="hidden"
                        name={`detalles[${index}][cantidad]`}
                        value={row.cantidad}
                    />
                    <input
                        type="hidden"
                        name={`detalles[${index}][precio_unitario]`}
                        value={row.precio_unitario}
                    />
                </Fragment>
            ))}

            <div className="bg-card sticky bottom-4 z-10 space-y-4 rounded-lg border p-4 shadow-lg">
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                    <div className="grid gap-1">
                        <span className="text-muted-foreground text-xs">
                            Subtotal
                        </span>
                        <span className="font-medium">
                            {currencyFormatter.format(subtotalGeneral)}
                        </span>
                    </div>

                    <div className="grid gap-1">
                        <Label
                            htmlFor="flete"
                            className="text-muted-foreground text-xs"
                        >
                            Flete
                        </Label>
                        <Input
                            id="flete"
                            name="flete"
                            readOnly={!puedeEditarDatos}
                            type="number"
                            min="0"
                            step="0.01"
                            value={flete}
                            onChange={(event) => setFlete(event.target.value)}
                        />
                        <InputError message={errors.flete} />
                    </div>

                    <div className="grid gap-1">
                        <Label
                            htmlFor="descuento"
                            className="text-muted-foreground text-xs"
                        >
                            Descuento
                        </Label>
                        <Input
                            id="descuento"
                            name="descuento"
                            readOnly={!puedeEditarDatos}
                            type="number"
                            min="0"
                            step="0.01"
                            value={descuento}
                            onChange={(event) =>
                                setDescuento(event.target.value)
                            }
                        />
                        <InputError message={errors.descuento} />
                    </div>

                    <div className="grid gap-1">
                        <Label
                            htmlFor="reteica"
                            className="text-muted-foreground text-xs"
                        >
                            Reteica
                        </Label>
                        <Input
                            id="reteica"
                            name="reteica"
                            readOnly={!puedeEditarDatos}
                            type="number"
                            min="0"
                            step="0.01"
                            value={reteica}
                            onChange={(event) => setReteica(event.target.value)}
                        />
                        <InputError message={errors.reteica} />
                    </div>

                    <div className="grid gap-1">
                        <Label
                            htmlFor="retefuente"
                            className="text-muted-foreground text-xs"
                        >
                            Retefuente
                        </Label>
                        <Input
                            id="retefuente"
                            name="retefuente"
                            readOnly={!puedeEditarDatos}
                            type="number"
                            min="0"
                            step="0.01"
                            value={retefuente}
                            onChange={(event) =>
                                setRetefuente(event.target.value)
                            }
                        />
                        <InputError message={errors.retefuente} />
                    </div>

                    <div className="grid gap-1 rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                        <span className="text-xs font-semibold">Total</span>
                        <span className="font-semibold">
                            {currencyFormatter.format(totalGeneral)}
                        </span>
                    </div>
                </div>

                {pedido ? (
                    <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:w-64">
                        <div className="grid gap-1">
                            <span className="text-muted-foreground text-xs">
                                Abono
                            </span>
                            <span className="font-medium text-emerald-600">
                                {currencyFormatter.format(Number(pedido.abono))}
                            </span>
                        </div>
                        <div className="grid gap-1">
                            <span className="text-muted-foreground text-xs">
                                Saldo
                            </span>
                            <span className="font-medium text-red-600">
                                {currencyFormatter.format(
                                    Number(pedido.saldo_pendiente),
                                )}
                            </span>
                        </div>
                    </div>
                ) : null}

                {actions ? (
                    <div className="flex justify-end gap-2 border-t pt-4">
                        {actions}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
