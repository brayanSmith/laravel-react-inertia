export type InicioSesion = {
    id: number;
    nombre: string;
    email: string;
    ip: string | null;
    navegador: string | null;
    sistema_operativo: string | null;
    dispositivo: string | null;
    created_at: string;
};
