import { Head, usePage } from '@inertiajs/react';
import { formatFechaCorta } from '@/lib/fechas';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateGastoModal from '@/components/create-gasto-modal';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import DeleteGastoModal from '@/components/delete-gasto-modal';
import EditGastoModal from '@/components/edit-gasto-modal';
import Heading from '@/components/heading';
import RestoreButton from '@/components/restore-button';
import TrashToggle from '@/components/trash-toggle';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index, restore } from '@/routes/gastos';
import type { Bodega, Gasto, GastoPermissions } from '@/types';

type Props = {
    gastos: Gasto[];
    eliminados: boolean;
    bodegas: Bodega[];
    permissions: GastoPermissions;
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

export default function GastosIndex({
    gastos,
    bodegas,
    permissions,
    eliminados,
}: Props) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [gastoToEdit, setGastoToEdit] = useState<Gasto | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [gastoToDelete, setGastoToDelete] = useState<Gasto | null>(null);

    const openEditDialog = (gasto: Gasto) => {
        setGastoToEdit(gasto);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (gasto: Gasto) => {
        setGastoToDelete(gasto);
        setDeleteDialogOpen(true);
    };

    const columns = useMemo<DataTableColumn<Gasto>[]>(
        () => [
            {
                key: 'descripcion',
                label: 'Descripción',
                getValue: (gasto) => gasto.descripcion,
                render: (gasto) => gasto.descripcion,
            },
            {
                key: 'bodega',
                label: 'Bodega',
                getValue: (gasto) => gasto.bodega?.nombre_bodega ?? '',
                render: (gasto) => gasto.bodega?.nombre_bodega ?? '—',
            },
            {
                key: 'fecha',
                label: 'Fecha',
                filter: 'date',
                getValue: (gasto) => gasto.fecha_gasto,
                render: (gasto) => formatFechaCorta(gasto.fecha_gasto),
            },
            {
                key: 'monto',
                label: 'Monto',
                align: 'right',
                getValue: (gasto) => Number(gasto.monto),
                render: (gasto) =>
                    currencyFormatter.format(Number(gasto.monto)),
            },
            {
                key: 'acciones',
                label: 'Acciones',
                align: 'right',
                filter: 'none',
                render: (gasto) =>
                    eliminados ? (
                        permissions.canRestore ? (
                            <div className="flex justify-end">
                                <RestoreButton
                                    action={restore([gasto.id])}
                                    nombre={`el gasto ${gasto.descripcion}`}
                                    dataTest="restore-gasto-button"
                                />
                            </div>
                        ) : null
                    ) : (
                        <TooltipProvider>
                            <div className="flex justify-end gap-2">
                                {permissions.canUpdate ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                data-test="edit-gasto-button"
                                                onClick={() =>
                                                    openEditDialog(gasto)
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
                                                data-test="delete-gasto-button"
                                                onClick={() =>
                                                    openDeleteDialog(gasto)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [permissions, eliminados],
    );

    return (
        <>
            <Head title="Gastos" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Gastos"
                        description="Administra los gastos registrados"
                    />

                    <div className="flex items-center gap-3">
                        <TrashToggle
                            eliminados={eliminados}
                            visible={permissions.canViewDeleted}
                        />

                        {permissions.canCreate && !eliminados ? (
                            <CreateGastoModal bodegas={bodegas}>
                                <Button data-test="create-gasto-button">
                                    <Plus /> Nuevo gasto
                                </Button>
                            </CreateGastoModal>
                        ) : null}
                    </div>
                </div>

                <DataTable
                    data={gastos}
                    columns={columns}
                    getRowId={(gasto) => gasto.id}
                    dataTestPrefix="gasto"
                    searchPlaceholder="Buscar gastos..."
                    emptyMessage="No hay gastos registrados."
                />
            </div>

            <EditGastoModal
                bodegas={bodegas}
                gasto={gastoToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteGastoModal
                gasto={gastoToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

GastosIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Gastos',
            href: index(),
        },
    ],
});
