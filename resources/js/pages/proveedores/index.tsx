import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateProveedorModal from '@/components/create-proveedor-modal';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import DeleteProveedorModal from '@/components/delete-proveedor-modal';
import EditProveedorModal from '@/components/edit-proveedor-modal';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index } from '@/routes/proveedores';
import type { Proveedor, ProveedorPermissions } from '@/types';

type Props = {
    proveedores: Proveedor[];
    permissions: ProveedorPermissions;
};

const TIPO_OPTIONS = [
    { value: 'REMISIONADO', label: 'Remisionado' },
    { value: 'ELECTRONICO', label: 'Electrónico' },
];

export default function ProveedoresIndex({ proveedores, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [proveedorToEdit, setProveedorToEdit] = useState<Proveedor | null>(
        null,
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [proveedorToDelete, setProveedorToDelete] =
        useState<Proveedor | null>(null);

    const teamSlug = currentTeam?.slug ?? '';

    const openEditDialog = (proveedor: Proveedor) => {
        setProveedorToEdit(proveedor);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (proveedor: Proveedor) => {
        setProveedorToDelete(proveedor);
        setDeleteDialogOpen(true);
    };

    const columns = useMemo<DataTableColumn<Proveedor>[]>(
        () => [
            {
                key: 'nombre',
                label: 'Nombre',
                getValue: (proveedor) => proveedor.nombre_proveedor,
                render: (proveedor) => proveedor.nombre_proveedor,
            },
            {
                key: 'nit',
                label: 'NIT',
                getValue: (proveedor) => proveedor.nit_proveedor,
                render: (proveedor) => proveedor.nit_proveedor,
            },
            {
                key: 'tipo',
                label: 'Tipo',
                filter: 'select',
                selectOptions: TIPO_OPTIONS,
                getValue: (proveedor) => proveedor.tipo_proveedor,
                render: (proveedor) => (
                    <Badge variant="secondary">
                        {proveedor.tipo_proveedor}
                    </Badge>
                ),
            },
            {
                key: 'categoria',
                label: 'Categoría',
                getValue: (proveedor) => proveedor.categoria_proveedor,
                render: (proveedor) => proveedor.categoria_proveedor,
            },
            {
                key: 'ciudad',
                label: 'Ciudad',
                getValue: (proveedor) => proveedor.ciudad_proveedor ?? '',
                render: (proveedor) => proveedor.ciudad_proveedor ?? '—',
            },
            {
                key: 'telefono',
                label: 'Teléfono',
                getValue: (proveedor) => proveedor.telefono_proveedor ?? '',
                render: (proveedor) => proveedor.telefono_proveedor ?? '—',
            },
            {
                key: 'acciones',
                label: 'Acciones',
                align: 'right',
                filter: 'none',
                render: (proveedor) => (
                    <TooltipProvider>
                        <div className="flex justify-end gap-2">
                            {permissions.canUpdate ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="edit-proveedor-button"
                                            onClick={() =>
                                                openEditDialog(proveedor)
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
                                            data-test="delete-proveedor-button"
                                            onClick={() =>
                                                openDeleteDialog(proveedor)
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
            <Head title="Proveedores" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Proveedores"
                        description="Administra los proveedores registrados"
                    />

                    {permissions.canCreate ? (
                        <CreateProveedorModal teamSlug={teamSlug}>
                            <Button data-test="create-proveedor-button">
                                <Plus /> Nuevo proveedor
                            </Button>
                        </CreateProveedorModal>
                    ) : null}
                </div>

                <DataTable
                    data={proveedores}
                    columns={columns}
                    getRowId={(proveedor) => proveedor.id}
                    dataTestPrefix="proveedor"
                    searchPlaceholder="Buscar proveedores..."
                    emptyMessage="No hay proveedores registrados."
                />
            </div>

            <EditProveedorModal
                teamSlug={teamSlug}
                proveedor={proveedorToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteProveedorModal
                teamSlug={teamSlug}
                proveedor={proveedorToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

ProveedoresIndex.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Proveedores',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
