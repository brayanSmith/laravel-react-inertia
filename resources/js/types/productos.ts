export type Producto = {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    costo: number;
    precio_detal: number;
    precio_mayorista: number;
    precio_especial: number;
    imagen: string | null;
};
