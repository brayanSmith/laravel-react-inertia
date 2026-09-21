import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup } from '@/types';

const STORAGE_KEY = 'sidebar:grupos-cerrados';

/** Which groups the user collapsed, remembered in the browser. */
function useGruposCerrados() {
    const [cerrados, setCerrados] = useState<string[]>(() => {
        try {
            const saved = JSON.parse(
                window.localStorage.getItem(STORAGE_KEY) ?? '[]',
            );

            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cerrados));
        } catch {
            // Storage unavailable: the groups just won't be remembered.
        }
    }, [cerrados]);

    const toggle = (label: string) =>
        setCerrados((prev) =>
            prev.includes(label)
                ? prev.filter((item) => item !== label)
                : [...prev, label],
        );

    return { cerrados, toggle };
}

function NavItems({ group }: { group: NavGroup }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarMenu>
            {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        asChild
                        isActive={isCurrentUrl(item.href)}
                        tooltip={{ children: item.title }}
                    >
                        <Link href={item.href} prefetch>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                    {item.badgePendiente ? (
                        <div className="pointer-events-none absolute top-1.5 right-1 flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                            {item.badge ? (
                                <span
                                    data-test="nav-badge"
                                    className="flex h-5 min-w-5 items-center justify-center rounded-md bg-amber-500 px-1 text-xs font-medium text-white tabular-nums"
                                >
                                    {item.badge}
                                </span>
                            ) : null}
                            <span
                                data-test="nav-badge-pendiente"
                                title="Compras pendientes"
                                className="flex h-5 min-w-5 items-center justify-center rounded-md bg-red-600 px-1 text-xs font-medium text-white tabular-nums"
                            >
                                {item.badgePendiente}
                            </span>
                        </div>
                    ) : item.badge ? (
                        <SidebarMenuBadge
                            data-test="nav-badge"
                            className="bg-amber-500 text-white peer-hover/menu-button:text-white peer-data-[active=true]/menu-button:text-white"
                        >
                            {item.badge}
                        </SidebarMenuBadge>
                    ) : null}
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}

/**
 * The sidebar's main navigation: one section per group. Labeled groups
 * collapse and expand (and are remembered); a group without a label renders
 * its items as standalone links.
 */
export function NavMain({ groups }: { groups: NavGroup[] }) {
    const { state } = useSidebar();
    const { cerrados, toggle } = useGruposCerrados();
    // In icon-only mode the labels are hidden, so nothing may stay collapsed.
    const iconMode = state === 'collapsed';

    return (
        <>
            {groups.map((group, index) =>
                group.label ? (
                    <Collapsible
                        key={group.label}
                        open={iconMode || !cerrados.includes(group.label)}
                        onOpenChange={() => toggle(group.label as string)}
                        className="group/collapsible"
                    >
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel asChild>
                                <CollapsibleTrigger
                                    className="hover:text-sidebar-foreground cursor-pointer"
                                    data-test="nav-group-toggle"
                                >
                                    {group.label}
                                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </CollapsibleTrigger>
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <NavItems group={group} />
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>
                ) : (
                    <SidebarGroup
                        key={`sin-grupo-${index}`}
                        className="px-2 py-0"
                    >
                        <NavItems group={group} />
                    </SidebarGroup>
                ),
            )}
        </>
    );
}
