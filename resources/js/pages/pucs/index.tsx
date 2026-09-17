import { Head, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreatePucModal from '@/components/create-puc-modal';
import DeletePucModal from '@/components/delete-puc-modal';
import EditPucModal from '@/components/edit-puc-modal';
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
import { index } from '@/routes/pucs';
import type { Puc, PucPermissions } from '@/types';

type Props = {
    pucs: Puc[];
    permissions: PucPermissions;
};

export default function PucsIndex({ pucs, permissions }: Props) {
    const { currentTeam } = usePage().props;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [pucToEdit, setPucToEdit] = useState<Puc | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pucToDelete, setPucToDelete] = useState<Puc | null>(null);

    const teamSlug = currentTeam?.slug ?? '';

    const openEditDialog = (puc: Puc) => {
        setPucToEdit(puc);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (puc: Puc) => {
        setPucToDelete(puc);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            <Head title="PUC" />

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Plan único de cuentas"
                        description="Administra las cuentas contables (PUC)"
                    />

                    {permissions.canCreate ? (
                        <CreatePucModal teamSlug={teamSlug}>
                            <Button data-test="create-puc-button">
                                <Plus /> Nueva cuenta
                            </Button>
                        </CreatePucModal>
                    ) : null}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Cuenta</TableHead>
                            <TableHead>Subcuenta</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pucs.map((puc) => (
                            <TableRow key={puc.id} data-test="puc-row">
                                <TableCell>
                                    <Badge variant="secondary">
                                        {puc.tipo}
                                    </Badge>
                                </TableCell>
                                <TableCell>{puc.cuenta}</TableCell>
                                <TableCell>{puc.subcuenta}</TableCell>
                                <TableCell>{puc.concepto}</TableCell>
                                <TableCell>{puc.descripcion ?? '—'}</TableCell>
                                <TableCell className="text-right">
                                    <TooltipProvider>
                                        <div className="flex justify-end gap-2">
                                            {permissions.canUpdate ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            data-test="edit-puc-button"
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    puc,
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
                                                            data-test="delete-puc-button"
                                                            onClick={() =>
                                                                openDeleteDialog(
                                                                    puc,
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

                {pucs.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                        No hay cuentas registradas.
                    </p>
                ) : null}
            </div>

            <EditPucModal
                teamSlug={teamSlug}
                puc={pucToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <DeletePucModal
                teamSlug={teamSlug}
                puc={pucToDelete}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}

PucsIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'PUC',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
