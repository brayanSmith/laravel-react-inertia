import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import ComprasTable from '@/components/compras-table';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { create, index } from '@/routes/compras';
import type { Compra, CompraPermissions } from '@/types';

type Props = {
    compras: Compra[];
    permissions: CompraPermissions;
};

export default function ComprasIndex({ compras, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    return (
        <>
            <Head title="Compras" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Compras"
                        description="Administra las compras a proveedores"
                    />

                    {permissions.canCreate ? (
                        <Button asChild data-test="create-compra-button">
                            <Link href={create(teamSlug)}>
                                <Plus /> Nueva compra
                            </Link>
                        </Button>
                    ) : null}
                </div>

                <ComprasTable compras={compras} permissions={permissions} />
            </div>
        </>
    );
}

ComprasIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Compras',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
