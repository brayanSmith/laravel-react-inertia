export type Bodega = {
    id: number;
    nombre_bodega: string;
    ubicacion_bodega: string | null;
};

export type BodegaPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};
