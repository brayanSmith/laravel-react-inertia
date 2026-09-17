export type Marca = {
    id: number;
    marca: string;
    descripcion_marca: string | null;
};

export type MarcaPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};
