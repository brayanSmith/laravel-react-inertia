export type Usuario = {
    id: number;
    name: string;
    email: string;
    roles: number[];
    tipos_precio_permitidos: string[];
};

export type UsuarioPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};

export type UsuarioRoleOption = {
    id: number;
    name: string;
};
