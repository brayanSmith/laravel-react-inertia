import type { Bodega } from './bodegas';
import type { ProductoOption } from './compras';

export type StockBodega = {
    id: number;
    producto_id: number;
    bodega_id: number;
    stock_inicial: string;
    entradas: string;
    salidas: string;
    stock: string;
    producto?: ProductoOption | null;
    bodega?: Bodega | null;
};
