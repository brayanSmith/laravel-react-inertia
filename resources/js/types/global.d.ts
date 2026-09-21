import type { Auth } from '@/types/auth';
import type { Team } from '@/types/teams';

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
            currentTeam: Team | null;
            teams: Team[];
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
            canViewIniciosSesion: boolean;
            /** Record totals shown as sidebar badges. */
            navCounts: {
                pedidos: number;
                pedidosMayoristas: number;
                compras: number;
            };
            [key: string]: unknown;
        };
    }
}
