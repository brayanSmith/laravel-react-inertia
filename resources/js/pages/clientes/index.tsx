import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateClienteModal from '@/components/create-cliente-modal';
import DeleteClienteModal from '@/components/delete-cliente-modal';
import EditClienteModal from '@/components/edit-cliente-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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

                <div className="space-y-3">
                    {clientes.map((cliente) => (
                        <div
                            key={cliente.id}
                            data-test="cliente-row"
                            className="flex items-center justify-between gap-4 rounded-lg border p-4"
                        >
                            <div>
                                <div className="font-medium">
                                    {cliente.nombre} {cliente.apellido}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    {cliente.n_documento} · {cliente.email}
                                    {cliente.telefono
                                        ? ` · ${cliente.telefono}`
                                        : ''}
                                </div>
                            </div>

                            <TooltipProvider>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                data-test="cliente-edit-button"
                                                onClick={() =>
                                                    openEditDialog(cliente)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Editar cliente</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                data-test="cliente-delete-button"
                                                onClick={() =>
                                                    openDeleteDialog(cliente)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Eliminar cliente</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </TooltipProvider>
                        </div>
                    ))}

                    {clientes.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center">
                            Todavía no tienes clientes registrados.
                        </p>
                    ) : null}
                </div>
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
