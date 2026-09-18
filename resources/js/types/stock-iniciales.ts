import type { Bodega } from './bodegas';
import type { ProductoOption } from './compras';

export type StockInicial = {
    id: number;
    producto_id: number;
    bodega_id: number;
    cantidad: number;
    producto?: ProductoOption | null;
    bodega?: Bodega | null;
};

export type StockInicialPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};
