export type HistorialCambio = {
    campo: string;
    antes: string | null;
    despues: string | null;
};

export type HistorialActividad = {
    id: number;
    fecha: string;
    usuario: string;
    modulo: string;
    registro: string;
    accion: string;
    cambios: HistorialCambio[];
};
