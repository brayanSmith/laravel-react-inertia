export type Role = {
    id: number;
    name: string;
    permissions: string[];
    bodegas: number[];
};

export type RoleBodegaOption = {
    id: number;
    nombre_bodega: string;
};

export type RoleMember = {
    id: number;
    name: string;
    email: string;
    roles: number[];
    tipos_precio_permitidos: string[];
};
