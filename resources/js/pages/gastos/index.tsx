import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateGastoModal from '@/components/create-gasto-modal';
import DeleteGastoModal from '@/components/delete-gasto-modal';
import EditGastoModal from '@/components/edit-gasto-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index } from '@/routes/gastos';
import type { Bodega, Gasto, GastoPermissions } from '@/types';

type Props = {
    gastos: Gasto[];
    bodegas: Bodega[];
    permissions: GastoPermissions;
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

export default function GastosIndex({ gastos, bodegas, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [gastoToEdit, setGastoToEdit] = useState<Gasto | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [gastoToDelete, setGastoToDelete] = useState<Gasto | null>(null);

    const teamSlug = currentTeam?.slug ?? '';

    const openEditDialog = (gasto: Gasto) => {
        setGastoToEdit(gasto);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (gasto: Gasto) => {
        setGastoToDelete(gasto);
        setDeleteDialogOpen(true);
    };

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

                    {permissions.canCreate ? (
                        <CreateGastoModal teamSlug={teamSlug} bodegas={bodegas}>
                            <Button data-test="create-gasto-button">
                                <Plus /> Nuevo gasto
                            </Button>
                        </CreateGastoModal>
                    ) : null}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Bodega</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gastos.map((gasto) => (
                            <TableRow key={gasto.id} data-test="gasto-row">
                                <TableCell>{gasto.descripcion}</TableCell>
                                <TableCell>
                                    {gasto.bodega?.nombre_bodega ?? '—'}
                                </TableCell>
                                <TableCell>{gasto.fecha_gasto}</TableCell>
                                <TableCell className="text-right">
                                    {currencyFormatter.format(
                                        Number(gasto.monto),
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
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
                                                                openEditDialog(
                                                                    gasto,
                                                                )
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
                                                                openDeleteDialog(
                                                                    gasto,
                                                                )
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
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {gastos.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                        No hay gastos registrados.
                    </p>
                ) : null}
            </div>

            <EditGastoModal
                teamSlug={teamSlug}
                bodegas={bodegas}
                gasto={gastoToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteGastoModal
                teamSlug={teamSlug}
                gasto={gastoToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

GastosIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Gastos',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
