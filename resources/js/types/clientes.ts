export type TipoDocumento = 'CC' | 'NIT' | 'CE' | 'TI' | 'PASAPORTE';

export type RetenedorFuente = 'SI' | 'NO';

export type Cliente = {
    id: number;
    tipo_documento: TipoDocumento;
    numero_documento: string;
    razon_social: string;
    direccion: string | null;
    telefono: string | null;
    ciudad: string | null;
    email: string | null;
    activo: boolean;
    novedad: string | null;
    rut_imagen: string | null;
    rut_imagen_url: string | null;
    retenedor_fuente: RetenedorFuente;
};

export type ClientePermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canViewDeleted: boolean;
    canRestore: boolean;
};
