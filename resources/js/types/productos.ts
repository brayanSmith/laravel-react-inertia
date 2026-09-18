export type CategoriaProducto = 'LLANTA' | 'RIN' | 'SERVICIO' | 'OTRO';

export type TipoProducto = 'NUEVO' | 'USADO';

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
