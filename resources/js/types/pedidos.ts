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

export type ProductoPedidoOption = {
    id: number;
    referencia_producto: string | null;
    concatenar_codigo_nombre: string | null;
    valor_detal: string | null;
    valor_mayorista: string | null;
    costo_producto: string | null;
};

export type PedidoDetalle = {
    id: number;
    producto_id: number;
    cantidad: string;
    precio_unitario: string;
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
    cliente?: ClienteOption | null;
    bodega?: { id: number; nombre_bodega: string } | null;
    user?: VendedorOption | null;
    detalles?: PedidoDetalle[];
    abonos?: PedidoAbono[];
};

export type PedidoPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};
