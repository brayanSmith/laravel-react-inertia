export type Role = {
    id: number;
    name: string;
    permissions: string[];
};

export type RoleMember = {
    id: number;
    name: string;
    email: string;
    roles: number[];
};
