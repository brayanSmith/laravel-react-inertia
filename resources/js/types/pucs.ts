export type TipoPuc = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type Puc = {
    id: number;
    tipo: TipoPuc;
    cuenta: string;
    subcuenta: string;
    concepto: string;
    descripcion: string | null;
    concatenar_subcuenta_concepto: string;
};

export type PucPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};
