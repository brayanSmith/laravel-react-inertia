import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import ComprasTable from '@/components/compras-table';
import Heading from '@/components/heading';
import TrashToggle from '@/components/trash-toggle';
import { Button } from '@/components/ui/button';
import { create, index } from '@/routes/compras';
import type { Compra, CompraPermissions } from '@/types';

type Props = {
    compras: Compra[];
    eliminados: boolean;
    permissions: CompraPermissions;
};

export default function ComprasIndex({
    compras,
    permissions,
    eliminados,
}: Props) {
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

                    <div className="flex items-center gap-3">
                        <TrashToggle
                            eliminados={eliminados}
                            visible={permissions.canDelete}
                        />

                        {permissions.canCreate && !eliminados ? (
                            <Button asChild data-test="create-compra-button">
                                <Link href={create(teamSlug)}>
                                    <Plus /> Nueva compra
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </div>

                <ComprasTable
                    compras={compras}
                    permissions={permissions}
                    eliminados={eliminados}
                />
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
