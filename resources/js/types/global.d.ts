import type { Auth } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            /** The company logo from "Empresas", when one was uploaded. */
            logoUrl: string | null;
            auth: Auth;
            sidebarOpen: boolean;
            /** Product prices the user may see: valor_detal, valor_mayorista, costo. */
            tiposPrecioPermitidos: string[];
            canViewRoles: boolean;
            canViewClientes: boolean;
            canViewUsuarios: boolean;
            canViewBodegas: boolean;
            canViewProveedores: boolean;
            canViewMarcas: boolean;
            canViewPucs: boolean;
            canViewEmpresa: boolean;
            canViewGastos: boolean;
            canViewProductos: boolean;
            canViewCotizador: boolean;
            canViewPos: boolean;
            canViewCompras: boolean;
            canViewPedidos: boolean;
            canViewPedidosMayoristas: boolean;
            canViewStockIniciales: boolean;
            canViewStockBodegas: boolean;
            canViewTraslados: boolean;
            canViewHistorial: boolean;
            canViewIniciosSesion: boolean;
            /** Record totals shown as sidebar badges. */
            navCounts: {
                pedidos: number;
                pedidosMayoristas: number;
                compras: number;
                comprasPendientes: number;
            };
            [key: string]: unknown;
        };
    }
}
