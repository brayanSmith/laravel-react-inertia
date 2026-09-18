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
    Package,
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
import { edit as empresaEdit } from '@/routes/empresa';
import { index as gastosIndex } from '@/routes/gastos';
import { index as marcasIndex } from '@/routes/marcas';
import { index as pedidosIndex } from '@/routes/pedidos';
import { index as productosIndex } from '@/routes/productos';
import { index as proveedoresIndex } from '@/routes/proveedores';
import { index as pucsIndex } from '@/routes/pucs';
import { index as stockBodegasIndex } from '@/routes/stock-bodegas';
import { index as stockInicialesIndex } from '@/routes/stock-iniciales';
import { index as rolesIndex } from '@/routes/teams/roles';
import { index as trasladosIndex } from '@/routes/traslados';
import { index as usuariosIndex } from '@/routes/usuarios';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage();
    const dashboardUrl = page.props.currentTeam
        ? dashboard(page.props.currentTeam.slug)
        : '/';
    const canManageRoles =
        page.props.currentTeam?.role === 'owner' ||
        page.props.currentTeam?.role === 'admin';

    const mainNavItems: NavItem[] = [
        {
            title: 'Panel',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
        ...(page.props.canViewClientes && page.props.currentTeam
            ? [
                  {
                      title: 'Clientes',
                      href: clientesIndex(page.props.currentTeam.slug),
                      icon: Users,
                  },
              ]
            : []),
        ...(page.props.canViewUsuarios && page.props.currentTeam
            ? [
                  {
                      title: 'Usuarios',
                      href: usuariosIndex(page.props.currentTeam.slug),
                      icon: UserCog,
                  },
              ]
            : []),
        ...(page.props.canViewBodegas && page.props.currentTeam
            ? [
                  {
                      title: 'Bodegas',
                      href: bodegasIndex(page.props.currentTeam.slug),
                      icon: Warehouse,
                  },
              ]
            : []),
        ...(page.props.canViewProveedores && page.props.currentTeam
            ? [
                  {
                      title: 'Proveedores',
                      href: proveedoresIndex(page.props.currentTeam.slug),
                      icon: Truck,
                  },
              ]
            : []),
        ...(page.props.canViewMarcas && page.props.currentTeam
            ? [
                  {
                      title: 'Marcas',
                      href: marcasIndex(page.props.currentTeam.slug),
                      icon: Tags,
                  },
              ]
            : []),
        ...(page.props.canViewPucs && page.props.currentTeam
            ? [
                  {
                      title: 'PUC',
                      href: pucsIndex(page.props.currentTeam.slug),
                      icon: Calculator,
                  },
              ]
            : []),
        ...(page.props.canViewCompras && page.props.currentTeam
            ? [
                  {
                      title: 'Compras',
                      href: comprasIndex(page.props.currentTeam.slug),
                      icon: ShoppingCart,
                  },
              ]
            : []),
        ...(page.props.canViewPedidos && page.props.currentTeam
            ? [
                  {
                      title: 'Pedidos',
                      href: pedidosIndex(page.props.currentTeam.slug),
                      icon: FileText,
                  },
              ]
            : []),
        ...(page.props.canViewGastos && page.props.currentTeam
            ? [
                  {
                      title: 'Gastos',
                      href: gastosIndex(page.props.currentTeam.slug),
                      icon: Receipt,
                  },
              ]
            : []),
        ...(page.props.canViewProductos && page.props.currentTeam
            ? [
                  {
                      title: 'Productos',
                      href: productosIndex(page.props.currentTeam.slug),
                      icon: Package,
                  },
              ]
            : []),
        ...(page.props.canViewStockIniciales && page.props.currentTeam
            ? [
                  {
                      title: 'Stock inicial',
                      href: stockInicialesIndex(page.props.currentTeam.slug),
                      icon: ClipboardList,
                  },
              ]
            : []),
        ...(page.props.canViewStockBodegas && page.props.currentTeam
            ? [
                  {
                      title: 'Stock por bodega',
                      href: stockBodegasIndex(page.props.currentTeam.slug),
                      icon: Boxes,
                  },
              ]
            : []),
        ...(page.props.canViewTraslados && page.props.currentTeam
            ? [
                  {
                      title: 'Traslados',
                      href: trasladosIndex(page.props.currentTeam.slug),
                      icon: ArrowLeftRight,
                  },
              ]
            : []),
        ...(page.props.canViewEmpresa && page.props.currentTeam
            ? [
                  {
                      title: 'Empresa',
                      href: empresaEdit(page.props.currentTeam.slug),
                      icon: Building2,
                  },
              ]
            : []),
        ...(canManageRoles && page.props.currentTeam
            ? [
                  {
                      title: 'Roles y permisos',
                      href: rolesIndex(page.props.currentTeam.slug),
                      icon: Shield,
                  },
              ]
            : []),
    ];

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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
