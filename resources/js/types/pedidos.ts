import type * as PedidosRoutesModule from '@/routes/pedidos';
import type * as PedidosAbonosRoutesModule from '@/routes/pedidos/abonos';

/**
 * Bundles the Wayfinder route helpers for a pedidos module ("pedidos" or
 * "pedidos-mayoristas") so shared components (PedidosTable, the abono
 * modals, etc.) can be reused by both without hardcoding either one's
 * routes — the page passes the right bundle in as a prop.
 */
export type PedidoRoutes = {
    pedidos: typeof PedidosRoutesModule;
    abonos: typeof PedidosAbonosRoutesModule;
};

export type EstadoPedido = 'PENDIENTE' | 'COMPLETADO';

export type EstadoPagoPedido = 'EN_CARTERA' | 'SALDADO' | 'NO_APLICA';

export type TipoPrecioPedido = 'DETAL' | 'MAYORISTA' | 'OTRO';

export type ClienteOption = {
    id: number;
    tipo_documento: string | null;
    numero_documento: string | null;
    razon_social: string;
    direccion: string | null;
    telefono: string | null;
    ciudad: string | null;
    email: string | null;
};

export type VendedorOption = {
    id: number;
    name: string;
};

export type PucOption = {
    id: number;
    concatenar_subcuenta_concepto: string | null;
};

export type StockBodegaOption = {
    id: number;
    bodega_id: number;
    producto_id: number;
    stock: string;
};

export type ProductoPedidoOption = {
    id: number;
    referencia_producto: string | null;
    concatenar_codigo_nombre: string | null;
    valor_detal: string | null;
    valor_mayorista: string | null;
    costo_producto: string | null;
    tipo_vehiculo?: string | null;
    stock_bodegas?: StockBodegaOption[];
    /** Sum of the product's stock over every bodega (the pedidos listing). */
    stock_total?: number | string | null;
};

export type PedidoDetalle = {
    id: number;
    producto_id: number;
    cantidad: string;
    precio_unitario: string;
    costo_unitario: string | null;
    costo_total: string | null;
    ganancia_total: string | null;
    subtotal: string;
    producto?: ProductoPedidoOption | null;
};

export type PedidoAbono = {
    id: number;
    fecha: string | null;
    monto: string;
    con_cuanto_pago: string | null;
    cambio: string;
    puc_id: number;
    descripcion: string | null;
    vendedor_id: number | null;
    puc?: PucOption | null;
    vendedor?: VendedorOption | null;
};

export type Pedido = {
    id: number;
    cliente_id: number;
    fecha: string | null;
    estado: EstadoPedido;
    estado_pago: EstadoPagoPedido;
    tipo_precio: TipoPrecioPedido;
    bodega_id: number;
    observacion: string | null;
    observacion_pago: string | null;
    subtotal: string;
    descuento: string;
    flete: string;
    total_a_pagar: string;
    abono: string;
    saldo_pendiente: string;
    user_id: number;
    placa: string | null;
    reteica: string;
    retefuente: string;
    facturacion_electronica: boolean;
    turno: string | null;
    deleted_at?: string | null;
    cliente?: ClienteOption | null;
    bodega?: { id: number; nombre_bodega: string } | null;
    user?: VendedorOption | null;
    detalles?: PedidoDetalle[];
    abonos?: PedidoAbono[];
};

/** What the user may do on the pedido edit form (each one is its own permission). */
export type PedidoEditPermissions = {
    canDelete: boolean;
    canCreateAbono: boolean;
    canUpdateAbono: boolean;
    canDeleteAbono: boolean;
    canCreateDetalle: boolean;
    canUpdateDetalle: boolean;
    canDeleteDetalle: boolean;
    canUpdateDatos: boolean;
};

export type PedidoPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canViewDeleted: boolean;
    canRestore: boolean;
    canViewDetalle: boolean;
};
