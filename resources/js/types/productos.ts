export type Producto = {
    id: number;
    categoria_id: number;
    sub_categoria_id: number;
    categoria_nombre: string | null;
    sub_categoria_nombre: string | null;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    costo: number;
    precio_detal: number;
    precio_mayorista: number;
    precio_especial: number;
    imagen: string | null;
};
