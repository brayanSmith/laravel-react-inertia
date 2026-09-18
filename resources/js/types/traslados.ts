import type { Bodega } from './bodegas';
import type { ProductoOption } from './compras';

export type Traslado = {
    id: number;
    bodega_donante_id: number;
    bodega_destino_id: number;
    producto_id: number;
    cantidad: number;
    observaciones: string | null;
    producto?: ProductoOption | null;
    bodega_donante?: Bodega | null;
    bodega_destino?: Bodega | null;
};

export type TrasladoPermissions = {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};
