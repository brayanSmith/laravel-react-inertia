import { Head, Link, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteCompraModal from '@/components/delete-compra-modal';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { create, edit, index } from '@/routes/compras';
import type { Compra, CompraPermissions } from '@/types';

type Props = {
    compras: Compra[];
    permissions: CompraPermissions;
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

export default function ComprasIndex({ compras, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [compraToDelete, setCompraToDelete] = useState<Compra | null>(null);

    const openDeleteDialog = (compra: Compra) => {
        setCompraToDelete(compra);
        setDeleteDialogOpen(true);
    };

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

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Factura</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {compras.map((compra) => (
                            <TableRow key={compra.id} data-test="compra-row">
                                <TableCell>{compra.factura}</TableCell>
                                <TableCell>
                                    {compra.proveedor?.nombre_proveedor ?? '—'}
                                </TableCell>
                                <TableCell>
                                    {compra.fecha
                                        ? new Date(
                                              compra.fecha,
                                          ).toLocaleDateString('es-CO')
                                        : '—'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={cn(
                                            'border-transparent',
                                            compra.estado === 'RECIBIDA'
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                                : 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                                        )}
                                    >
                                        {compra.estado}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {currencyFormatter.format(
                                        Number(compra.total_a_pagar),
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
                                                            data-test="edit-compra-button"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={edit([
                                                                    teamSlug,
                                                                    compra.id,
                                                                ])}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
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
                                                            data-test="delete-compra-button"
                                                            onClick={() =>
                                                                openDeleteDialog(
                                                                    compra,
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

                {compras.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                        No hay compras registradas.
                    </p>
                ) : null}
            </div>

            <DeleteCompraModal
                teamSlug={teamSlug}
                compra={compraToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
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
