export type Empresa = {
    id: number;
    nombre_empresa: string;
    direccion_empresa: string | null;
    telefono_empresa: string | null;
    email_empresa: string | null;
    nit_empresa: string | null;
    logo_empresa: string | null;
    logo_empresa_url: string | null;
};

export type EmpresaPermissions = {
    canUpdate: boolean;
};
