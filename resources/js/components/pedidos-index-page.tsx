import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import PedidoDetallesTable from '@/components/pedido-detalles-table';
import PedidosTable from '@/components/pedidos-table';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Pedido, PedidoPermissions, PedidoRoutes } from '@/types';

type Props = {
    pedidos: Pedido[];
    permissions: PedidoPermissions;
    routes: PedidoRoutes;
    title: string;
    description: string;
};

type VistaPedidos = 'pedido' | 'detalle';

export default function PedidosIndexPage({
    pedidos,
    permissions,
    routes,
    title,
    description,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [vista, setVista] = useState<VistaPedidos>('pedido');

    return (
        <>
            <Head title={title} />

            <div className="flex flex-col space-y-10">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title={title}
                        description={description}
                    />

                    <div className="flex items-center gap-3">
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={vista}
                            onValueChange={(value) => {
                                if (value) {
                                    setVista(value as VistaPedidos);
                                }
                            }}
                            data-test="pedidos-vista-toggle"
                        >
                            <ToggleGroupItem
                                value="pedido"
                                data-test="pedidos-vista-pedido"
                            >
                                Por pedido
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="detalle"
                                data-test="pedidos-vista-detalle"
                            >
                                Por detalle
                            </ToggleGroupItem>
                        </ToggleGroup>

                        {permissions.canCreate ? (
                            <Button asChild data-test="create-pedido-button">
                                <Link href={routes.pedidos.create(teamSlug)}>
                                    <Plus /> Nuevo pedido
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </div>

                {vista === 'pedido' ? (
                    <PedidosTable
                        pedidos={pedidos}
                        permissions={permissions}
                        routes={routes}
                    />
                ) : (
                    <PedidoDetallesTable pedidos={pedidos} routes={routes} />
                )}
            </div>
        </>
    );
}
