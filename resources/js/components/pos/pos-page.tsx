import { Form, Head, router, usePage } from '@inertiajs/react';
import { History } from 'lucide-react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import PosAddProductModal from '@/components/pos/pos-add-product-modal';
import PosClienteHistorialModal from '@/components/pos/pos-cliente-historial-modal';
import PosClienteModal from '@/components/pos/pos-cliente-modal';
import PosPagoModal, {
    POS_CHECKOUT_FORM_ID,
} from '@/components/pos/pos-pago-modal';
import PosAtajosModal from '@/components/pos/pos-atajos-modal';
import PosExitoModal from '@/components/pos/pos-exito-modal';
import PosPedidosHistorialModal from '@/components/pos/pos-pedidos-historial-modal';
import PosVentasTabs from '@/components/pos/pos-ventas-tabs';
import PosCartPanel from '@/components/pos/pos-cart-panel';
import PosCatalog from '@/components/pos/pos-catalog';
import type { PosCartLine } from '@/hooks/use-pos-cart';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { usePosAbonos } from '@/hooks/use-pos-abonos';
import { usePosCart } from '@/hooks/use-pos-cart';
import { usePosHeader } from '@/hooks/use-pos-header';
import { usePosVentas } from '@/hooks/use-pos-ventas';
import { precioParaTipo } from '@/lib/pedido-pricing';
import { Button } from '@/components/ui/button';
import { pedidos as pedidosPos, store } from '@/routes/pos';
import { voucher as voucherRoute } from '@/routes/pos/pedidos';
import type {
    BodegaOption,
    ClienteOption,
    MarcaOption,
    PosCatalogoProducto,
    PosVoucher,
    PucOption,
    TipoPrecioPedido,
    VendedorOption,
} from '@/types';

type Props = {
    clientes: ClienteOption[];
    productos: PosCatalogoProducto[];
    bodegas: BodegaOption[];
    vendedores: VendedorOption[];
    pucs: PucOption[];
    marcas: MarcaOption[];
    canCreateProducto: boolean;
    canCreateCliente: boolean;
};

export default function PosPage({
    clientes,
    productos,
    bodegas,
    vendedores,
    pucs,
    marcas,
    canCreateProducto,
    canCreateCliente,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const userId = usePage().props.auth?.user?.id ?? 0;

    // Sales in progress live in localStorage, so leaving the POS (or a
    // reload) doesn't lose them; each tab is an independent pedido.
    const ventas = usePosVentas(`pos:ventas:v1:${userId}:${teamSlug}`);
    const { header, setField, resetVenta } = usePosHeader(
        ventas.activa.header,
        ventas.setHeader,
    );
    const cart = usePosCart(ventas.activa.lines, ventas.setLines);
    const abonos = usePosAbonos(ventas.activa.abonos, ventas.setAbonos);

    const { depurar } = ventas;
    useEffect(() => {
        depurar(new Set(productos.map((producto) => producto.id)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productos]);
    const [clienteModalOpen, setClienteModalOpen] = useState(false);
    const [historialOpen, setHistorialOpen] = useState(false);
    const [pagoOpen, setPagoOpen] = useState(false);
    const [pedidosOpen, setPedidosOpen] = useState(false);
    const [voucher, setVoucher] = useState<PosVoucher | null>(null);
    const [ayudaOpen, setAyudaOpen] = useState(false);
    const [actualizando, setActualizando] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const nuevoProductoRef = useRef<HTMLButtonElement>(null);
    const [processing, setProcessing] = useState(false);
    const pageErrors = (usePage().props.errors ?? {}) as Partial<
        Record<string, string>
    >;
    const cliente =
        clientes.find((item) => String(item.id) === header.clienteId) ?? null;
    const [pendiente, setPendiente] = useState<{
        producto: PosCatalogoProducto;
        bodegaId: string;
    } | null>(null);

    const productoPorId = useMemo(
        () => new Map(productos.map((producto) => [producto.id, producto])),
        [productos],
    );

    // Changing the tipo de precio re-prices what is already in the cart
    // (Detal / Mayorista / Otro), not only the products added afterwards.
    const handleFieldChange: typeof setField = (key, value) => {
        setField(key, value);

        if (key === 'tipoPrecio') {
            cart.reprice((productoId) => {
                const producto = productoPorId.get(productoId);

                return producto
                    ? precioParaTipo(producto, value as TipoPrecioPedido)
                    : undefined;
            });
        }
    };

    const nombreDe = (producto: PosCatalogoProducto) =>
        producto.concatenar_codigo_nombre ??
        producto.referencia_producto ??
        `Producto ${producto.id}`;

    // Back to an empty pedido: after a finished sale, or when the customer
    // cancels it.
    const reiniciarVenta = () => {
        cart.clear();
        abonos.clear();
        resetVenta();
        setPagoOpen(false);
        setClienteModalOpen(false);
        setHistorialOpen(false);
    };

    // A finished sale just closes its tab (the last one is emptied instead).
    const finalizarVenta = () => {
        setPagoOpen(false);
        setClienteModalOpen(false);
        setHistorialOpen(false);
        ventas.cerrar(ventas.activa.id);
    };

    const handleReset = () => {
        if (
            (cart.lines.length > 0 || header.clienteId !== '') &&
            !window.confirm('¿Cancelar este pedido y vaciarlo por completo?')
        ) {
            return;
        }

        reiniciarVenta();
    };

    // Catalog clicks always ask for quantity / price / bodega first.
    const handleSelect = (producto: PosCatalogoProducto) =>
        setPendiente({ producto, bodegaId: header.bodegaId });

    // Clicking a cart line reopens the same modal to change quantity,
    // value or bodega.
    const handleEditLine = (line: PosCartLine) => {
        const producto = productoPorId.get(line.productoId);

        if (producto) {
            setPendiente({ producto, bodegaId: String(line.bodegaId) });
        }
    };

    // The catalog shows the stock of the bodega chosen in the right panel
    // (all bodegas while none is chosen), minus what the cart already holds.
    const stockDisponibleDe = (producto: PosCatalogoProducto): number => {
        if (!header.bodegaId) {
            return (
                producto.stock_total -
                (cart.reservedByProducto.get(producto.id) ?? 0)
            );
        }

        return (
            (producto.stock_por_bodega[header.bodegaId] ?? 0) -
            (cart.lineFor(producto.id, Number(header.bodegaId))?.cantidad ?? 0)
        );
    };

    // Reloads only the catalog (stock) — no full page reload.
    const actualizarInventario = () => {
        router.reload({
            only: ['productos'],
            onStart: () => setActualizando(true),
            onFinish: () => setActualizando(false),
            onSuccess: () => toast.success('Inventario actualizado'),
        });
    };

    const puedeProceder =
        cart.lines.length > 0 &&
        header.clienteId !== '' &&
        header.bodegaId !== '' &&
        header.vendedorId !== '';

    // Keyboard shortcuts (ignored while a dialog is open). Listed in the
    // F1 help modal.
    useHotkeys(
        [
            { key: 'F1', handler: () => setAyudaOpen(true) },
            {
                key: 'F2',
                handler: () => {
                    searchRef.current?.focus();
                    searchRef.current?.select();
                },
            },
            { key: 'F3', handler: () => setClienteModalOpen(true) },
            { key: 'F4', handler: () => nuevoProductoRef.current?.click() },
            { key: 'F7', handler: actualizarInventario },
            { key: 'F8', handler: handleReset },
            {
                key: 'F9',
                handler: () => {
                    if (puedeProceder && !processing) {
                        setPagoOpen(true);
                    }
                },
            },
            { key: 'F10', handler: () => setPedidosOpen(true) },
            { key: 'n', alt: true, handler: ventas.nuevaVenta },
            ...Array.from({ length: 9 }, (_, index) => ({
                key: String(index + 1),
                code: `Digit${index + 1}`,
                alt: true,
                handler: () => {
                    const venta = ventas.ventas[index];

                    if (venta) {
                        ventas.seleccionar(venta.id);
                    }
                },
            })),
        ],
        { ignoreWhenDialog: true },
    );

    return (
        <>
            <Head title="POS" />

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_460px] 2xl:grid-cols-[1fr_520px]">
                <div className="flex flex-col gap-3">
                    <PosVentasTabs
                        ventas={ventas.ventas}
                        activaId={ventas.activa.id}
                        onSelect={ventas.seleccionar}
                        onNew={ventas.nuevaVenta}
                        onClose={ventas.cerrar}
                    />

                    <PosCatalog
                        productos={productos}
                        stockDisponibleDe={stockDisponibleDe}
                        reservedByProducto={cart.reservedByProducto}
                        tipoPrecio={header.tipoPrecio}
                        onAdd={handleSelect}
                        teamSlug={teamSlug}
                        marcas={marcas}
                        canCreateProducto={canCreateProducto}
                        searchRef={searchRef}
                        nuevoProductoRef={nuevoProductoRef}
                        onRefresh={actualizarInventario}
                        refreshing={actualizando}
                    />

                    <div className="sticky bottom-4 z-10 w-fit">
                        <Button
                            type="button"
                            className="shadow-lg"
                            onClick={() => setPedidosOpen(true)}
                            data-test="pos-historial-pedidos"
                        >
                            <History /> Historial de pedidos
                        </Button>
                    </div>
                </div>

                <div className="lg:sticky lg:top-4">
                    <PosCartPanel
                        key={ventas.activa.id}
                        cliente={cliente}
                        onOpenClientePicker={() => setClienteModalOpen(true)}
                        onOpenHistorial={() => setHistorialOpen(true)}
                        onProceedToPay={() => setPagoOpen(true)}
                        onReset={handleReset}
                        canProceder={puedeProceder}
                        bodegas={bodegas}
                        vendedores={vendedores}
                        header={header}
                        onFieldChange={handleFieldChange}
                        cart={cart}
                        onEditLine={handleEditLine}
                        errors={pageErrors}
                        processing={processing}
                    />
                </div>
            </div>

            {/* Only carries the sale's data; the visible UI (and the submit
                button, in the payment modal) live outside so no dialog is
                ever nested inside this form. */}
            <Form
                className="hidden"
                {...store.form(teamSlug)}
                id={POS_CHECKOUT_FORM_ID}
                transform={(data) => ({
                    ...data,
                    fecha: new Date().toISOString(),
                })}
                // Stay on the page (no remount, scroll and filters kept) and
                // only refresh the catalog, so its stock reflects this sale.
                options={{
                    preserveState: true,
                    preserveScroll: true,
                    only: ['productos'],
                }}
                onStart={() => setProcessing(true)}
                onFinish={() => setProcessing(false)}
                onSuccess={(page) => {
                    finalizarVenta();
                    setVoucher(
                        (page.flash as { pedido_creado?: PosVoucher })
                            .pedido_creado ?? null,
                    );
                }}
            >
                <>
                    <input
                        type="hidden"
                        name="cliente_id"
                        value={header.clienteId}
                    />
                    <input
                        type="hidden"
                        name="bodega_id"
                        value={header.bodegaId}
                    />
                    <input
                        type="hidden"
                        name="user_id"
                        value={header.vendedorId}
                    />
                    <input
                        type="hidden"
                        name="tipo_precio"
                        value={header.tipoPrecio}
                    />
                    <input
                        type="hidden"
                        name="descuento"
                        value={header.descuento}
                    />
                    <input type="hidden" name="flete" value={header.flete} />
                    <input
                        type="hidden"
                        name="reteica"
                        value={header.reteica}
                    />
                    <input
                        type="hidden"
                        name="retefuente"
                        value={header.retefuente}
                    />
                    <input
                        type="hidden"
                        name="observacion_pago"
                        value={abonos.observacionPago}
                    />
                    <input
                        type="hidden"
                        name="tipo_pago"
                        value={header.tipoPago}
                    />

                    {abonos.abonos.map((abono, index) => (
                        <Fragment key={abono.id}>
                            <input
                                type="hidden"
                                name={`abonos[${index}][puc_id]`}
                                value={abono.pucId}
                            />
                            <input
                                type="hidden"
                                name={`abonos[${index}][monto]`}
                                value={abono.monto}
                            />
                            <input
                                type="hidden"
                                name={`abonos[${index}][con_cuanto_pago]`}
                                value={abono.conCuantoPago}
                            />
                            <input
                                type="hidden"
                                name={`abonos[${index}][descripcion]`}
                                value={abono.descripcion}
                            />
                        </Fragment>
                    ))}
                    <input type="hidden" name="placa" value={header.placa} />
                    <input
                        type="hidden"
                        name="aplica_turno"
                        value={header.aplicaTurno ? '1' : '0'}
                    />
                    <input
                        type="hidden"
                        name="facturacion_electronica"
                        value={header.facturacionElectronica ? '1' : '0'}
                    />
                    <input
                        type="hidden"
                        name="observacion"
                        value={header.observacion}
                    />

                    {cart.lines.map((line, index) => (
                        <Fragment key={line.key}>
                            <input
                                type="hidden"
                                name={`detalles[${index}][producto_id]`}
                                value={line.productoId}
                            />
                            <input
                                type="hidden"
                                name={`detalles[${index}][bodega_id]`}
                                value={line.bodegaId}
                            />
                            <input
                                type="hidden"
                                name={`detalles[${index}][cantidad]`}
                                value={line.cantidad}
                            />
                            <input
                                type="hidden"
                                name={`detalles[${index}][precio_unitario]`}
                                value={line.precioUnitario}
                            />
                        </Fragment>
                    ))}
                </>
            </Form>

            {clienteModalOpen ? (
                <PosClienteModal
                    clientes={clientes}
                    selectedId={header.clienteId}
                    teamSlug={teamSlug}
                    canCreate={canCreateCliente}
                    onSelect={(clienteId) => {
                        setField('clienteId', clienteId);
                        setClienteModalOpen(false);
                    }}
                    onClose={() => setClienteModalOpen(false)}
                />
            ) : null}

            {historialOpen && cliente ? (
                <PosClienteHistorialModal
                    cliente={cliente}
                    teamSlug={teamSlug}
                    onClose={() => setHistorialOpen(false)}
                />
            ) : null}

            {pagoOpen ? (
                <PosPagoModal
                    header={header}
                    onFieldChange={setField}
                    totalBruto={cart.totalBruto}
                    pucs={pucs}
                    abonos={abonos.abonos}
                    onAddAbono={abonos.addAbono}
                    onRemoveAbono={abonos.removeAbono}
                    totalAbonado={abonos.totalAbonado}
                    observacionPago={abonos.observacionPago}
                    errors={pageErrors}
                    processing={processing}
                    onClose={() => setPagoOpen(false)}
                />
            ) : null}

            {ayudaOpen ? (
                <PosAtajosModal onClose={() => setAyudaOpen(false)} />
            ) : null}

            {voucher ? (
                <PosExitoModal
                    voucher={voucher}
                    onClose={() => setVoucher(null)}
                />
            ) : null}

            {pedidosOpen ? (
                <PosPedidosHistorialModal
                    title="Historial de pedidos"
                    showCliente
                    defaultHoy
                    vendedores={vendedores}
                    buildRoute={({ desde, hasta, user_id, page }) =>
                        pedidosPos(teamSlug, {
                            query: { desde, hasta, user_id, page },
                        })
                    }
                    buildVoucherRoute={(pedidoId) =>
                        voucherRoute([teamSlug, pedidoId])
                    }
                    onClose={() => setPedidosOpen(false)}
                />
            ) : null}

            {pendiente ? (
                <PosAddProductModal
                    key={`${pendiente.producto.id}:${pendiente.bodegaId}`}
                    producto={pendiente.producto}
                    bodegas={bodegas}
                    defaultBodegaId={pendiente.bodegaId}
                    tipoPrecio={header.tipoPrecio}
                    lineFor={cart.lineFor}
                    onClose={() => setPendiente(null)}
                    onConfirm={(selection) => {
                        cart.upsertLine({
                            productoId: pendiente.producto.id,
                            nombre: nombreDe(pendiente.producto),
                            ...selection,
                        });
                        setPendiente(null);
                    }}
                />
            ) : null}
        </>
    );
}
