import { Head, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import ClientesTable from '@/components/clientes-table';
import CreateClienteModal from '@/components/create-cliente-modal';
import DeleteClienteModal from '@/components/delete-cliente-modal';
import EditClienteModal from '@/components/edit-cliente-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/clientes';
import type { Cliente } from '@/types';

type Props = {
    clientes: Cliente[];
};

export default function ClientesIndex({ clientes }: Props) {
    const { currentTeam } = usePage().props;
    const currentTeamSlug = currentTeam?.slug ?? '';

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [clienteEditing, setClienteEditing] = useState<Cliente | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clienteDeleting, setClienteDeleting] = useState<Cliente | null>(
        null,
    );

    const openEditDialog = (cliente: Cliente) => {
        setClienteEditing(cliente);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (cliente: Cliente) => {
        setClienteDeleting(cliente);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Head title="Clientes" />

            <h1 className="sr-only">Clientes</h1>

            <div className="flex flex-col space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Clientes"
                        description="Administra los clientes de tu equipo"
                    />

                    <CreateClienteModal currentTeamSlug={currentTeamSlug}>
                        <Button data-test="clientes-new-cliente-button">
                            <Plus /> Nuevo cliente
                        </Button>
                    </CreateClienteModal>
                </div>

                <ClientesTable
                    clientes={clientes}
                    onEdit={openEditDialog}
                    onDelete={openDeleteDialog}
                />
            </div>

            <EditClienteModal
                currentTeamSlug={currentTeamSlug}
                cliente={clienteEditing}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteClienteModal
                currentTeamSlug={currentTeamSlug}
                cliente={clienteDeleting}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

ClientesIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Clientes',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
