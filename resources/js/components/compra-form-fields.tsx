import { Fragment, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import Combobox from '@/components/combobox';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
    BodegaOption,
    Compra,
    EstadoCompra,
    ProductoOption,
    ProveedorOption,
} from '@/types';

type FormErrors = Partial<Record<string, string>>;

type Props = {
    compra?: Compra | null;
    proveedores: ProveedorOption[];
    productos: ProductoOption[];
    bodegas: BodegaOption[];
    errors: FormErrors;
    actions?: ReactNode;
};

type DetalleRow = {
    producto_id: number;
    bodega_id: number;
    cantidad: number;
    precio_unitario: number;
    recibido: boolean;
};

type DetalleGroup = {
    producto_id: number;
    nombre: string;
    cantidadesPorBodega: Record<number, number>;
    precio_unitario: number;
    recibido: boolean;
    subtotal: number;
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

function productoLabel(producto: ProductoOption): string {
    return (
        producto.concatenar_codigo_nombre ??
        producto.referencia_producto ??
        `Producto ${producto.id}`
    );
}

export default function CompraFormFields({
    compra,
    proveedores,
    productos,
    bodegas,
    errors,
    actions,
}: Props) {
    const productoMap = useMemo(
        () => new Map(productos.map((producto) => [producto.id, producto])),
        [productos],
    );

    const proveedorOptions = useMemo(
        () =>
            proveedores.map((proveedor) => ({
                value: String(proveedor.id),
                label: proveedor.nombre_proveedor,
            })),
        [proveedores],
    );
    const productoOptions = useMemo(
        () =>
            productos.map((producto) => ({
                value: String(producto.id),
                label: productoLabel(producto),
            })),
        [productos],
    );

    const [proveedorId, setProveedorId] = useState<string>(
        compra?.proveedor_id ? String(compra.proveedor_id) : '',
    );
    const [descuento, setDescuento] = useState<string>(
        compra?.descuento ?? '0',
    );
    const [rows, setRows] = useState<DetalleRow[]>(
        (compra?.detalles_compra ?? []).map((detalle) => ({
            producto_id: detalle.producto_id,
            bodega_id: detalle.bodega_id,
            cantidad: Number(detalle.cantidad),
            precio_unitario: Number(detalle.precio_unitario),
            recibido: detalle.estado_entrega === 'RECIBIDA',
        })),
    );

    const [selectedProductoId, setSelectedProductoId] = useState<string>('');
    const [cantidades, setCantidades] = useState<Record<number, string>>({});
    const [precioUnitario, setPrecioUnitario] = useState<string>('');

    const resetAddRow = () => {
        setSelectedProductoId('');
        setCantidades({});
        setPrecioUnitario('');
    };

    const handleSelectProducto = (value: string) => {
        setSelectedProductoId(value);

        const producto = productoMap.get(Number(value));

        if (producto && !precioUnitario) {
            setPrecioUnitario(String(Number(producto.costo_producto ?? 0)));
        }
    };

    const cantidadTotalAddRow = bodegas.reduce(
        (sum, bodega) => sum + (Number(cantidades[bodega.id]) || 0),
        0,
    );
    const subtotalAddRow = cantidadTotalAddRow * (Number(precioUnitario) || 0);
    const canAgregar = Boolean(selectedProductoId) && cantidadTotalAddRow > 0;

    const handleAgregar = () => {
        if (!canAgregar) {
            return;
        }

        const productoId = Number(selectedProductoId);
        const precio = Number(precioUnitario) || 0;

        const newRows: DetalleRow[] = bodegas
            .map((bodega) => ({
                bodega_id: bodega.id,
                cantidad: Number(cantidades[bodega.id]) || 0,
            }))
            .filter((entry) => entry.cantidad > 0)
            .map((entry) => ({
                producto_id: productoId,
                bodega_id: entry.bodega_id,
                cantidad: entry.cantidad,
                precio_unitario: precio,
                recibido: false,
            }));

        setRows((prev) => [
            ...prev.filter((row) => row.producto_id !== productoId),
            ...newRows,
        ]);
        resetAddRow();
    };

    const grouped: DetalleGroup[] = useMemo(() => {
        const map = new Map<number, DetalleGroup>();

        for (const row of rows) {
            let group = map.get(row.producto_id);

            if (!group) {
                const producto = productoMap.get(row.producto_id);

                group = {
                    producto_id: row.producto_id,
                    nombre: producto
                        ? productoLabel(producto)
                        : `Producto ${row.producto_id}`,
                    cantidadesPorBodega: {},
                    precio_unitario: row.precio_unitario,
                    recibido: true,
                    subtotal: 0,
                };
                map.set(row.producto_id, group);
            }

            group.cantidadesPorBodega[row.bodega_id] =
                (group.cantidadesPorBodega[row.bodega_id] ?? 0) + row.cantidad;
            group.subtotal += row.cantidad * row.precio_unitario;
            group.recibido = group.recibido && row.recibido;
        }

        return Array.from(map.values());
    }, [rows, productoMap]);

    const handleEditarGrupo = (group: DetalleGroup) => {
        setSelectedProductoId(String(group.producto_id));
        setPrecioUnitario(String(group.precio_unitario));

        const nextCantidades: Record<number, string> = {};

        for (const bodega of bodegas) {
            const cantidad = group.cantidadesPorBodega[bodega.id];

            if (cantidad) {
                nextCantidades[bodega.id] = String(cantidad);
            }
        }

        setCantidades(nextCantidades);
        setRows((prev) =>
            prev.filter((row) => row.producto_id !== group.producto_id),
        );
    };

    const handleEliminarGrupo = (productoId: number) => {
        setRows((prev) => prev.filter((row) => row.producto_id !== productoId));
    };

    const handleToggleRecibido = (productoId: number, checked: boolean) => {
        setRows((prev) =>
            prev.map((row) =>
                row.producto_id === productoId
                    ? { ...row, recibido: checked }
                    : row,
            ),
        );
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
        subtotalGeneral - (Number(descuento) || 0),
        0,
    );
    const estadoCompra: EstadoCompra =
        rows.length > 0 && rows.every((row) => row.recibido)
            ? 'RECIBIDA'
            : 'PENDIENTE';

    return (
        <div className="space-y-6">
            <div className="bg-card space-y-4 rounded-lg border p-4">
                <div className="font-semibold">
                    Datos Generales de la Compra
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                    <div className="grid gap-2">
                        <Label htmlFor="factura">Factura</Label>
                        <Input
                            id="factura"
                            name="factura"
                            data-test="compra-factura"
                            defaultValue={compra?.factura ?? ''}
                            required
                        />
                        <InputError message={errors.factura} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Proveedor</Label>
                        <Combobox
                            options={proveedorOptions}
                            value={proveedorId}
                            onValueChange={setProveedorId}
                            searchPlaceholder="Buscar proveedor..."
                            emptyText="No se encontraron proveedores."
                            dataTest="compra-proveedor"
                        />
                        <input
                            type="hidden"
                            name="proveedor_id"
                            value={proveedorId}
                        />
                        <InputError message={errors.proveedor_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="fecha">Fecha</Label>
                        <Input
                            id="fecha"
                            name="fecha"
                            type="datetime-local"
                            data-test="compra-fecha"
                            defaultValue={toDatetimeLocal(compra?.fecha)}
                            required
                        />
                        <InputError message={errors.fecha} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Estado</Label>
                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium',
                                estadoCompra === 'RECIBIDA'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-amber-200 bg-amber-50 text-amber-700',
                            )}
                        >
                            <span
                                className={cn(
                                    'h-2 w-2 rounded-full',
                                    estadoCompra === 'RECIBIDA'
                                        ? 'bg-emerald-500'
                                        : 'bg-amber-500',
                                )}
                            />
                            {estadoCompra}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Se calcula según el check "Recibido" de cada
                            producto en el detalle.
                        </p>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                        id="observaciones"
                        name="observaciones"
                        data-test="compra-observaciones"
                        defaultValue={compra?.observaciones ?? ''}
                    />
                    <InputError message={errors.observaciones} />
                </div>
            </div>

            <div className="bg-card overflow-x-auto rounded-lg border">
                <Table className="[&_tr]:divide-x">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            {bodegas.map((bodega) => (
                                <TableHead
                                    key={bodega.id}
                                    className="text-center"
                                >
                                    {bodega.nombre_bodega}
                                </TableHead>
                            ))}
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
                        <TableRow>
                            <TableCell>
                                <Combobox
                                    options={productoOptions}
                                    value={selectedProductoId}
                                    onValueChange={handleSelectProducto}
                                    placeholder="Seleccione un producto..."
                                    searchPlaceholder="Buscar producto..."
                                    emptyText="No se encontraron productos."
                                    dataTest="compra-producto-select"
                                />
                            </TableCell>
                            {bodegas.map((bodega) => (
                                <TableCell
                                    key={bodega.id}
                                    className="text-center"
                                >
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        className="mx-auto w-24 text-center"
                                        value={cantidades[bodega.id] ?? ''}
                                        onChange={(event) =>
                                            setCantidades((prev) => ({
                                                ...prev,
                                                [bodega.id]: event.target.value,
                                            }))
                                        }
                                    />
                                </TableCell>
                            ))}
                            <TableCell className="text-center">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="mx-auto w-32 text-center"
                                    value={precioUnitario}
                                    onChange={(event) =>
                                        setPrecioUnitario(event.target.value)
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
                                    data-test="compra-agregar-detalle"
                                    disabled={!canAgregar}
                                    onClick={handleAgregar}
                                >
                                    + Agregar
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            <InputError message={errors.detalles} />

            <div className="bg-card space-y-4 rounded-lg border p-4">
                <div className="font-semibold">Detalle de la Compra</div>

                <div className="overflow-x-auto">
                    <Table className="[&_tr]:divide-x">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                {bodegas.map((bodega) => (
                                    <TableHead
                                        key={bodega.id}
                                        className="text-center"
                                    >
                                        {bodega.nombre_bodega}
                                    </TableHead>
                                ))}
                                <TableHead className="text-center">
                                    Precio Unitario
                                </TableHead>
                                <TableHead className="text-center">
                                    Subtotal
                                </TableHead>
                                <TableHead className="text-center">
                                    Recibido
                                </TableHead>
                                <TableHead className="text-center">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grouped.map((group) => (
                                <TableRow
                                    key={group.producto_id}
                                    data-test="compra-detalle-row"
                                >
                                    <TableCell>{group.nombre}</TableCell>
                                    {bodegas.map((bodega) => (
                                        <TableCell
                                            key={bodega.id}
                                            className="text-center"
                                        >
                                            {group.cantidadesPorBodega[
                                                bodega.id
                                            ] ? (
                                                group.cantidadesPorBodega[
                                                    bodega.id
                                                ]
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    0
                                                </span>
                                            )}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center">
                                        {currencyFormatter.format(
                                            group.precio_unitario,
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {currencyFormatter.format(
                                            group.subtotal,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col items-center gap-1">
                                            <Checkbox
                                                checked={group.recibido}
                                                onCheckedChange={(checked) =>
                                                    handleToggleRecibido(
                                                        group.producto_id,
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <span
                                                className={cn(
                                                    'text-xs font-medium',
                                                    group.recibido
                                                        ? 'text-emerald-600'
                                                        : 'text-amber-600',
                                                )}
                                            >
                                                {group.recibido
                                                    ? 'Recibido'
                                                    : 'Pendiente'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                data-test="compra-editar-detalle"
                                                onClick={() =>
                                                    handleEditarGrupo(group)
                                                }
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                data-test="compra-eliminar-detalle"
                                                onClick={() =>
                                                    handleEliminarGrupo(
                                                        group.producto_id,
                                                    )
                                                }
                                            >
                                                Eliminar
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {grouped.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">
                        Aún no hay productos agregados a la compra.
                    </p>
                ) : (
                    <div className="flex justify-center">
                        <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Items agregados: {rows.length}
                        </Badge>
                    </div>
                )}
            </div>

            {rows.map((row, index) => (
                <Fragment key={`${row.producto_id}-${row.bodega_id}`}>
                    <input
                        type="hidden"
                        name={`detalles[${index}][producto_id]`}
                        value={row.producto_id}
                    />
                    <input
                        type="hidden"
                        name={`detalles[${index}][bodega_id]`}
                        value={row.bodega_id}
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
                    <input
                        type="hidden"
                        name={`detalles[${index}][recibido]`}
                        value={row.recibido ? '1' : '0'}
                    />
                </Fragment>
            ))}

            <div className="sticky bottom-4 z-10 flex justify-end">
                <div className="bg-card w-full max-w-xs space-y-2 rounded-lg border p-4 shadow-lg">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">
                            {currencyFormatter.format(subtotalGeneral)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                        <Label
                            htmlFor="descuento"
                            className="text-muted-foreground"
                        >
                            Descuento
                        </Label>
                        <Input
                            id="descuento"
                            name="descuento"
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-32 text-right"
                            value={descuento}
                            onChange={(event) =>
                                setDescuento(event.target.value)
                            }
                        />
                    </div>
                    <InputError message={errors.descuento} />
                    <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                        <span className="text-sm font-semibold">Total</span>
                        <span className="font-semibold">
                            {currencyFormatter.format(totalGeneral)}
                        </span>
                    </div>

                    {actions ? (
                        <div className="flex justify-end gap-2 pt-2">
                            {actions}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
