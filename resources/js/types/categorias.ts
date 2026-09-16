export type SubCategoria = {
    id: number;
    categoria_id: number;
    nombre: string;
    descripcion: string | null;
    productos_count?: number;
};

export type Categoria = {
    id: number;
    nombre: string;
    descripcion: string | null;
    sub_categorias_count?: number;
    productos_count?: number;
    sub_categorias?: SubCategoria[];
};

export type CategoriaWithSubCategorias = Pick<Categoria, 'id' | 'nombre'> & {
    sub_categorias: Pick<SubCategoria, 'id' | 'categoria_id' | 'nombre'>[];
};
