export type TipoProveedor = 'REMISIONADO' | 'ELECTRONICO';

export type CategoriaProveedor = 'DECLARANTE' | 'NO_DECLARANTE' | 'RETENEDOR';

export type TipoCuentaProveedor = 'AHORRO' | 'CORRIENTE';

export type Proveedor = {
    id: number;
    nombre_proveedor: string;
    razon_social_proveedor: string | null;
    nit_proveedor: string;
    rut_proveedor_imagen: string | null;
    rut_proveedor_imagen_url: string | null;
    tipo_proveedor: TipoProveedor;
    categoria_proveedor: CategoriaProveedor;
    departamento_proveedor: string | null;
    ciudad_proveedor: string | null;
    direccion_proveedor: string | null;
    telefono_proveedor: string | null;
    banco_proveedor: string | null;
    tipo_cuenta_proveedor: TipoCuentaProveedor | null;
    numero_cuenta_proveedor: string | null;
    convenio: string | null;
    tiempo_respuesta: string | null;
    fabricante: string | null;
    flete: boolean;
    valor_flete: string;
};

export type ProveedorPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canViewDeleted: boolean;
    canRestore: boolean;
};
