import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteAbonoModal from '@/components/delete-abono-modal';
import EditAbonoModal from '@/components/edit-abono-modal';
import RegistrarPagoModal from '@/components/registrar-pago-modal';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type {
    Pedido,
    PedidoAbono,
    PedidoRoutes,
    PucOption,
    VendedorOption,
} from '@/types';

type Props = {
    teamSlug: string;
    pedido: Pedido;
    routes: PedidoRoutes;
    pucs: PucOption[];
    vendedores: VendedorOption[];
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export default function PedidoAbonosCard({
    teamSlug,
    pedido,
    routes,
    pucs,
    vendedores,
}: Props) {
    const [registrarOpen, setRegistrarOpen] = useState(false);
    const [editAbono, setEditAbono] = useState<PedidoAbono | null>(null);
    const [deleteAbono, setDeleteAbono] = useState<PedidoAbono | null>(null);

    const abonos = pedido.abonos ?? [];

    return (
        <div className="bg-card space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Abonos Registrados
                </div>
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    data-test="registrar-pago-button"
                    onClick={() => setRegistrarOpen(true)}
                >
                    Registrar Pago
                </Button>
            </div>

            {abonos.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                    Aún no hay pagos registrados para este pedido.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Método de pago</TableHead>
                                <TableHead>Observaciones</TableHead>
                                <TableHead className="text-right">
                                    Monto
                                </TableHead>
                                <TableHead className="text-right">
                                    Con cuánto pagó
                                </TableHead>
                                <TableHead className="text-right">
                                    Cambio
                                </TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {abonos.map((abono) => (
                                <TableRow
                                    key={abono.id}
                                    data-test="pedido-abono-row"
                                >
                                    <TableCell>
                                        {abono.puc?.concatenar_subcuenta_concepto ??
                                            '—'}
                                    </TableCell>
                                    <TableCell>
                                        {abono.descripcion ?? '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-emerald-600">
                                        {currencyFormatter.format(
                                            Number(abono.monto),
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {currencyFormatter.format(
                                            Number(
                                                abono.con_cuanto_pago ??
                                                    abono.monto,
                                            ),
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-right">
                                        {currencyFormatter.format(
                                            Number(abono.cambio),
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {abono.fecha
                                            ? new Date(
                                                  abono.fecha,
                                              ).toLocaleString('es-CO')
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                data-test="edit-abono-button"
                                                onClick={() =>
                                                    setEditAbono(abono)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                data-test="delete-abono-button"
                                                onClick={() =>
                                                    setDeleteAbono(abono)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <RegistrarPagoModal
                teamSlug={teamSlug}
                pedido={pedido}
                routes={routes}
                pucs={pucs}
                vendedores={vendedores}
                open={registrarOpen}
                onOpenChange={setRegistrarOpen}
            />

            <EditAbonoModal
                teamSlug={teamSlug}
                pedido={pedido}
                routes={routes}
                abono={editAbono}
                pucs={pucs}
                vendedores={vendedores}
                open={editAbono !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditAbono(null);
                    }
                }}
            />

            <DeleteAbonoModal
                teamSlug={teamSlug}
                pedido={pedido}
                routes={routes}
                abono={deleteAbono}
                open={deleteAbono !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteAbono(null);
                    }
                }}
            />
        </div>
    );
}
