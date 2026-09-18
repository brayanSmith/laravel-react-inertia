import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateStockInicialModal from '@/components/create-stock-inicial-modal';
import DataTable, { type DataTableColumn } from '@/components/data-table';
import DeleteStockInicialModal from '@/components/delete-stock-inicial-modal';
import EditStockInicialModal from '@/components/edit-stock-inicial-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { index } from '@/routes/stock-iniciales';
import type {
    Bodega,
    ProductoOption,
    StockInicial,
    StockInicialPermissions,
} from '@/types';

type Props = {
    stockIniciales: StockInicial[];
    productos: ProductoOption[];
    bodegas: Bodega[];
    permissions: StockInicialPermissions;
};

export default function StockInicialesIndex({
    stockIniciales,
    productos,
    bodegas,
    permissions,
}: Props) {
    const { currentTeam } = usePage().props;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [stockInicialToEdit, setStockInicialToEdit] =
        useState<StockInicial | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stockInicialToDelete, setStockInicialToDelete] =
        useState<StockInicial | null>(null);

    const teamSlug = currentTeam?.slug ?? '';

    const openEditDialog = (stockInicial: StockInicial) => {
        setStockInicialToEdit(stockInicial);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (stockInicial: StockInicial) => {
        setStockInicialToDelete(stockInicial);
        setDeleteDialogOpen(true);
    };

    const productoLabel = (stockInicial: StockInicial) =>
        stockInicial.producto?.concatenar_codigo_nombre ??
        stockInicial.producto?.referencia_producto ??
        `Producto ${stockInicial.producto_id}`;

    const columns = useMemo<DataTableColumn<StockInicial>[]>(
        () => [
            {
                key: 'producto',
                label: 'Producto',
                getValue: (stockInicial) => productoLabel(stockInicial),
                render: (stockInicial) => productoLabel(stockInicial),
            },
            {
                key: 'bodega',
                label: 'Bodega',
                getValue: (stockInicial) =>
                    stockInicial.bodega?.nombre_bodega ?? '',
                render: (stockInicial) =>
                    stockInicial.bodega?.nombre_bodega ?? '—',
            },
            {
                key: 'cantidad',
                label: 'Cantidad',
                align: 'right',
                getValue: (stockInicial) => Number(stockInicial.cantidad),
                render: (stockInicial) => stockInicial.cantidad,
            },
            {
                key: 'acciones',
                label: 'Acciones',
                align: 'right',
                filter: 'none',
                render: (stockInicial) => (
                    <TooltipProvider>
                        <div className="flex justify-end gap-2">
                            {permissions.canUpdate ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            data-test="edit-stock-inicial-button"
                                            onClick={() =>
                                                openEditDialog(stockInicial)
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
                                            data-test="delete-stock-inicial-button"
                                            onClick={() =>
                                                openDeleteDialog(stockInicial)
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
        [permissions],
    );

    return (
        <>
            <Head title="Stock inicial" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Stock inicial"
                        description="Administra el stock inicial de los productos por bodega"
                    />

                    {permissions.canCreate ? (
                        <CreateStockInicialModal
                            teamSlug={teamSlug}
                            productos={productos}
                            bodegas={bodegas}
                        >
                            <Button data-test="create-stock-inicial-button">
                                <Plus /> Nuevo stock inicial
                            </Button>
                        </CreateStockInicialModal>
                    ) : null}
                </div>

                <DataTable
                    data={stockIniciales}
                    columns={columns}
                    getRowId={(stockInicial) => stockInicial.id}
                    dataTestPrefix="stock-inicial"
                    searchPlaceholder="Buscar stock inicial..."
                    emptyMessage="No hay stock inicial registrado."
                />
            </div>

            <EditStockInicialModal
                teamSlug={teamSlug}
                productos={productos}
                bodegas={bodegas}
                stockInicial={stockInicialToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeleteStockInicialModal
                teamSlug={teamSlug}
                stockInicial={stockInicialToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

StockInicialesIndex.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Stock inicial',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
