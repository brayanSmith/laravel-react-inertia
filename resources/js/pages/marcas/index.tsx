import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateMarcaModal from '@/components/create-marca-modal';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import DeleteMarcaModal from '@/components/delete-marca-modal';
import EditMarcaModal from '@/components/edit-marca-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index } from '@/routes/marcas';
import type { Marca, MarcaPermissions } from '@/types';

type Props = {
    marcas: Marca[];
    permissions: MarcaPermissions;
};

export default function MarcasIndex({ marcas, permissions }: Props) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [marcaToEdit, setMarcaToEdit] = useState<Marca | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [marcaToDelete, setMarcaToDelete] = useState<Marca | null>(null);

    const openEditDialog = (marca: Marca) => {
        setMarcaToEdit(marca);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (marca: Marca) => {
        setMarcaToDelete(marca);
        setDeleteDialogOpen(true);
    };

    const columns = useMemo<DataTableColumn<Marca>[]>(
        () => [
            {
                key: 'nombre',
                label: 'Nombre',
                getValue: (marca) => marca.marca,
                render: (marca) => marca.marca,
            },
            {
                key: 'descripcion',
                label: 'Descripción',
                getValue: (marca) => marca.descripcion_marca ?? '',
                render: (marca) => marca.descripcion_marca ?? '—',
            },
            {
                key: 'acciones',
                label: 'Acciones',
                align: 'right',
                filter: 'none',
                render: (marca) => (
                    <TooltipProvider>
                        <div className="flex justify-end gap-2">
                            {permissions.canUpdate ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="edit-marca-button"
                                            onClick={() =>
                                                openEditDialog(marca)
                                            }
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Editar</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}

                            {permissions.canDelete ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="delete-marca-button"
                                            onClick={() =>
                                                openDeleteDialog(marca)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Eliminar</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}
                        </div>
                    </TooltipProvider>
                ),
            },
        ],
        [permissions],
    );

    return (
        <>
            <Head title="Marcas" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Marcas"
                        description="Administra las marcas del catálogo de productos"
                    />

                    {permissions.canCreate ? (
                        <CreateMarcaModal>
                            <Button data-test="create-marca-button">
                                <Plus /> Nueva marca
                            </Button>
                        </CreateMarcaModal>
                    ) : null}
                </div>

                <DataTable
                    data={marcas}
                    columns={columns}
                    getRowId={(marca) => marca.id}
                    dataTestPrefix="marca"
                    searchPlaceholder="Buscar marcas..."
                    emptyMessage="No hay marcas registradas."
                />
            </div>

            <EditMarcaModal
                marca={marcaToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteMarcaModal
                marca={marcaToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

MarcasIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Marcas',
            href: index(),
        },
    ],
});
