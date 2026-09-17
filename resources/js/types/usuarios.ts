export type UsuarioTeamRole = 'admin' | 'member';

export type Usuario = {
    id: number;
    name: string;
    email: string;
    team_role: UsuarioTeamRole;
    team_role_label: string;
    roles: number[];
    is_owner: boolean;
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
