export type CategoriaProducto = 'LLANTA' | 'RIN' | 'SERVICIO' | 'OTRO';

export type TipoProducto = 'NUEVO' | 'USADO' | 'SERVICIO';

export type TipoVehiculo = 'MOTO' | 'CARRO';

export type MarcaOption = {
    id: number;
    marca: string;
};

export type Producto = {
    id: number;
    categoria: CategoriaProducto | null;
    tipo: TipoProducto | null;
    inventariable: boolean;
    sku: string | null;
    ancho: string | null;
    perfil: string | null;
    construccion: string | null;
    rin: string | null;
    tipo_vehiculo: TipoVehiculo | null;
    diametro: string | null;
    marca_id: number | null;
    marca: MarcaOption | null;
    referencia_producto: string | null;
    descripcion_producto: string | null;
    costo_producto: string;
    valor_detal: string;
    valor_mayorista: string;
    valor_sin_instalacion: string;
    imagen_producto: string | null;
    imagen_producto_url: string | null;
    concatenar_codigo_nombre: string | null;
    stock_total?: number;
    pendiente?: number;
    proveedor_pendiente?: string | null;
    stock_por_bodega?: Record<string, number>;
};

export type ProductoPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};

export type LaravelPaginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

export type ProductoDetallePedido = {
    id: number;
    pedido_id: number;
    cantidad: string;
    precio_unitario: string;
    subtotal: string;
    pedido?: {
        id: number;
        fecha: string | null;
        estado: string;
        cliente?: { id: number; razon_social: string } | null;
    } | null;
};

export type ProductoDetalleCompra = {
    id: number;
    compra_id: number;
    cantidad: string;
    precio_unitario: string;
    subtotal: string;
    estado_entrega: string;
    compra?: {
        id: number;
        factura: string;
        fecha: string | null;
        estado: string;
        proveedor?: { id: number; nombre_proveedor: string } | null;
    } | null;
    bodega?: { id: number; nombre_bodega: string } | null;
};

export type ProductoDetallesResponse = {
    detallePedidos: LaravelPaginator<ProductoDetallePedido>;
    detalleCompras: LaravelPaginator<ProductoDetalleCompra>;
    totalComprado: number;
    totalVendido: number;
};

export type CantidadPorBodegaFila = {
    almacen: string;
    NUEVO: number;
    USADO: number;
    SERVICIO: number;
    total: number;
    valores: Record<'NUEVO' | 'USADO' | 'SERVICIO' | 'total', number>;
};

export type CantidadPorBodega = {
    filas: CantidadPorBodegaFila[];
    totales: Omit<CantidadPorBodegaFila, 'almacen' | 'valores'>;
};

export type DashboardResumen = {
    productosVendidos: {
        cantidad: number;
        valor: number;
        serie: { fecha: string; cantidad: number; valor: number }[];
    };
    valorPedidos: { valor: number; cantidad: number };
    inversion: number;
    gastos: number;
    ganancia: number;
    ajustes: { reteica: number; retefuente: number; descuento: number };
};

export type DashboardGraficos = {
    categorias: { categoria: string; cantidad: number; valor: number }[];
    topProductos: { producto: string; cantidad: number; valor: number }[];
    pedidosPorFecha: {
        fecha: string;
        pedidos: number;
        cantidad: number;
        valor: number;
        inversion: number;
    }[];
    gastosPorFecha: { fecha: string; gastos: number }[];
};

export type DashboardFiltros = {
    bodega_ids: string[];
    desde: string;
    hasta: string;
    tipo_vehiculo: string;
    producto_ids: string[];
};

export type DashboardBodegaOption = { id: number; nombre_bodega: string };

export type DashboardProductoOption = {
    id: number;
    concatenar_codigo_nombre: string | null;
    tipo_vehiculo: 'MOTO' | 'CARRO' | null;
};
