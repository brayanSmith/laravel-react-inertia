/** A catalog entry on the POS screen — a richer view of a product than
 * `ProductoPedidoOption`, adding the image, stock and extra price fields
 * the catalog cards need. */
export type PosCatalogoProducto = {
    id: number;
    referencia_producto: string | null;
    concatenar_codigo_nombre: string | null;
    categoria: string | null;
    sku: string | null;
    valor_detal: string | null;
    valor_mayorista: string | null;
    valor_sin_instalacion: string | null;
    costo_producto: string | null;
    imagen_producto_url: string | null;
    stock_total: number;
    /** Stock per bodega id (as returned by the backend, keys are bodega ids). */
    stock_por_bodega: Record<string, number>;
};

export type TipoPagoPedido =
    'CONTADO' | 'APARTADO' | 'CONTRA_ENTREGA' | 'CREDITO';

/** One row of a cliente's order history in the POS history modal. */
export type PosPedidoHistorial = {
    id: number;
    fecha: string | null;
    cliente: string | null;
    vendedor: string | null;
    tipo_precio: string;
    tipo_pago: string;
    estado: string;
    estado_pago: string;
    total_a_pagar: string;
    saldo_pendiente: string;
    productos: string[];
};

/** What the payment voucher prints; built by the backend's `PedidoVoucher`. */
export type PosVoucher = {
    empresa: {
        nombre: string | null;
        direccion: string | null;
        telefono: string | null;
        nit: string | null;
        logo_url: string | null;
    };
    pedido: {
        id: number;
        turno: string | null;
        fecha: string | null;
        placa: string | null;
        facturacion_electronica: boolean;
        observacion: string | null;
        observacion_pago: string | null;
        subtotal: number;
        descuento: number;
        flete: number;
        retefuente: number;
        reteica: number;
        total_a_pagar: number;
        abono: number;
        saldo_pendiente: number;
    };
    vendedor: string | null;
    cliente: {
        razon_social: string | null;
        numero_documento: string | null;
        ciudad: string | null;
        direccion: string | null;
        telefono: string | null;
        email: string | null;
    };
    detalles: { nombre: string; cantidad: number; total: number }[];
};
