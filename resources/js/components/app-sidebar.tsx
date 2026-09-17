import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    FolderGit2,
    LayoutGrid,
    Shield,
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
import { index as proveedoresIndex } from '@/routes/proveedores';
import { index as rolesIndex } from '@/routes/teams/roles';
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
            title: 'Dashboard',
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
        ...(canManageRoles && page.props.currentTeam
            ? [
                  {
                      title: 'Roles and permissions',
                      href: rolesIndex(page.props.currentTeam.slug),
                      icon: Shield,
                  },
              ]
            : []),
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: FolderGit2,
        },
        {
            title: 'Documentation',
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
