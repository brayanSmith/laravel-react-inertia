export type TipoPrecioCotizador = 'DETAL' | 'MAYORISTA';

export type CotizadorProducto = {
    id: number;
    referencia_producto: string | null;
    concatenar_codigo_nombre: string | null;
    valor_detal: string;
    valor_mayorista: string;
    imagen_producto_url: string | null;
    stock_total: number;
};
