import type { Bodega } from './bodegas';
import type { ProductoOption } from './compras';

export type ProductoInversionOption = ProductoOption & {
    valor_detal: string;
    valor_mayorista: string;
};

export type StockBodega = {
    id: number;
    producto_id: number;
    bodega_id: number;
    stock_inicial: string;
    entradas: string;
    salidas: string;
    stock: string;
    producto?: ProductoInversionOption | null;
    bodega?: Bodega | null;
};
