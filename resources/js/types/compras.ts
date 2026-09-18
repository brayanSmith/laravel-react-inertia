export type EstadoCompra = 'PENDIENTE' | 'RECIBIDA';

export type ProveedorOption = {
    id: number;
    nombre_proveedor: string;
};

export type ProductoOption = {
    id: number;
    referencia_producto: string | null;
    concatenar_codigo_nombre: string | null;
    costo_producto: string;
};

export type BodegaOption = {
    id: number;
    nombre_bodega: string;
};

export type CompraDetalle = {
    id: number;
    producto_id: number;
    bodega_id: number;
    cantidad: string;
    precio_unitario: string;
    subtotal: string;
    estado_entrega: EstadoCompra;
    producto?: ProductoOption | null;
    bodega?: BodegaOption | null;
};

export type Compra = {
    id: number;
    factura: string;
    proveedor_id: number;
    fecha: string | null;
    estado: EstadoCompra;
    observaciones: string | null;
    subtotal: string;
    descuento: string;
    total_a_pagar: string;
    proveedor?: ProveedorOption | null;
    detalles_compra?: CompraDetalle[];
};

export type CompraPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};
