import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    /** A count shown as a badge; hidden when 0 or missing. */
    badge?: number;
};

/** A sidebar section. Without a `label` its items are standalone links. */
export type NavGroup = {
    label?: string;
    items: NavItem[];
};
