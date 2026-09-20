import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    BookOpen,
    Boxes,
    Building2,
    Calculator,
    ClipboardList,
    FileText,
    FolderGit2,
    LayoutGrid,
    LogIn,
    MonitorSmartphone,
    Package,
    Quote,
    Receipt,
    Shield,
    ShoppingCart,
    Tags,
    Truck,
    UserCog,
    Users,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as bodegasIndex } from '@/routes/bodegas';
import { index as clientesIndex } from '@/routes/clientes';
import { index as comprasIndex } from '@/routes/compras';
import { index as cotizadorIndex } from '@/routes/cotizador';
import { edit as empresaEdit } from '@/routes/empresa';
import { index as gastosIndex } from '@/routes/gastos';
import { index as iniciosSesionIndex } from '@/routes/inicios-sesion';
import { index as marcasIndex } from '@/routes/marcas';
import { index as pedidosIndex } from '@/routes/pedidos';
import { index as pedidosMayoristasIndex } from '@/routes/pedidos-mayoristas';
import { index as posIndex } from '@/routes/pos';
import { index as productosIndex } from '@/routes/productos';
import { index as proveedoresIndex } from '@/routes/proveedores';
import { index as pucsIndex } from '@/routes/pucs';
import { index as stockBodegasIndex } from '@/routes/stock-bodegas';
import { index as stockInicialesIndex } from '@/routes/stock-iniciales';
import { index as rolesIndex } from '@/routes/teams/roles';
import { index as trasladosIndex } from '@/routes/traslados';
import { index as usuariosIndex } from '@/routes/usuarios';
import type { NavGroup, NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage();
    const team = page.props.currentTeam?.slug;
    const dashboardUrl = team ? dashboard(team) : '/';
    const canManageRoles =
        page.props.currentTeam?.role === 'owner' ||
        page.props.currentTeam?.role === 'admin';

    // Every entry is shown only when the user has the permission for it.
    const entry = (
        visible: boolean,
        title: string,
        href: (slug: string) => NavItem['href'],
        icon: NavItem['icon'],
        badge?: number,
    ): NavItem[] =>
        visible && team ? [{ title, href: href(team), icon, badge }] : [];

    const groups: NavGroup[] = [
        {
            items: [
                { title: 'Escritorio', href: dashboardUrl, icon: LayoutGrid },
                ...entry(
                    page.props.canViewEmpresa,
                    'Empresas',
                    empresaEdit,
                    Building2,
                ),
            ],
        },
        {
            label: 'Sistema',
            items: [
                ...entry(
                    page.props.canViewCotizador,
                    'Cotizar',
                    cotizadorIndex,
                    Quote,
                ),
                ...entry(
                    page.props.canViewPos,
                    'POS',
                    posIndex,
                    MonitorSmartphone,
                ),
                ...entry(
                    page.props.canViewGastos,
                    'Gastos',
                    gastosIndex,
                    Receipt,
                ),
                ...entry(page.props.canViewPucs, 'Puc', pucsIndex, Calculator),
            ],
        },
        {
            label: 'Pedidos',
            items: [
                ...entry(
                    page.props.canViewPedidos,
                    'Pedidos General',
                    pedidosIndex,
                    FileText,
                    page.props.navCounts?.pedidos,
                ),
                ...entry(
                    page.props.canViewPedidosMayoristas,
                    'Pedidos Mayorista',
                    pedidosMayoristasIndex,
                    FileText,
                    page.props.navCounts?.pedidosMayoristas,
                ),
            ],
        },
        {
            label: 'Compras',
            items: entry(
                page.props.canViewCompras,
                'Compras',
                comprasIndex,
                ShoppingCart,
                page.props.navCounts?.compras,
            ),
        },
        {
            label: 'Productos',
            items: [
                ...entry(
                    page.props.canViewBodegas,
                    'Bodegas',
                    bodegasIndex,
                    Warehouse,
                ),
                ...entry(page.props.canViewMarcas, 'Marcas', marcasIndex, Tags),
                ...entry(
                    page.props.canViewProductos,
                    'Productos',
                    productosIndex,
                    Package,
                ),
            ],
        },
        {
            label: 'Stock',
            items: [
                ...entry(
                    page.props.canViewStockBodegas,
                    'Stock Bodegas',
                    stockBodegasIndex,
                    Boxes,
                ),
                ...entry(
                    page.props.canViewStockIniciales,
                    'Stocks Iniciales',
                    stockInicialesIndex,
                    ClipboardList,
                ),
                ...entry(
                    page.props.canViewTraslados,
                    'Traslados',
                    trasladosIndex,
                    ArrowLeftRight,
                ),
            ],
        },
        {
            label: 'Users',
            items: [
                ...entry(
                    page.props.canViewClientes,
                    'Clientes',
                    clientesIndex,
                    Users,
                ),
                ...entry(
                    page.props.canViewProveedores,
                    'Proveedores',
                    proveedoresIndex,
                    Truck,
                ),
                ...entry(
                    page.props.canViewUsuarios,
                    'Users',
                    usuariosIndex,
                    UserCog,
                ),
            ],
        },
        {
            label: 'Seguridad',
            items: [
                ...entry(
                    canManageRoles,
                    'Roles y Permisos',
                    rolesIndex,
                    Shield,
                ),
                ...entry(
                    page.props.canViewIniciosSesion,
                    'Inicios de sesión',
                    iniciosSesionIndex,
                    LogIn,
                ),
            ],
        },
    ].filter((group) => group.items.length > 0);

    const footerNavItems: NavItem[] = [
        {
            title: 'Repositorio',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: FolderGit2,
        },
        {
            title: 'Documentación',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <TeamSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={groups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
