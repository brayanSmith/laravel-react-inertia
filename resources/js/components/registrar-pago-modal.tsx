import { Form } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Combobox from '@/components/combobox';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Pedido, PedidoRoutes, PucOption, VendedorOption } from '@/types';

type Props = {
    pedido: Pedido;
    routes: PedidoRoutes;
    pucs: PucOption[];
    vendedores: VendedorOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export default function RegistrarPagoModal({
    pedido,
    routes,
    pucs,
    vendedores,
    open,
    onOpenChange,
}: Props) {
    const defaultMonto = pedido.saldo_pendiente ?? '';

    const pucOptions = useMemo(
        () =>
            pucs.map((puc) => ({
                value: String(puc.id),
                label: puc.concatenar_subcuenta_concepto ?? `Puc ${puc.id}`,
            })),
        [pucs],
    );
    const vendedorOptions = useMemo(
        () =>
            vendedores.map((vendedor) => ({
                value: String(vendedor.id),
                label: vendedor.name,
            })),
        [vendedores],
    );

    const [pucId, setPucId] = useState<string>('');
    const [vendedorId, setVendedorId] = useState<string>(
        pedido.user_id ? String(pedido.user_id) : '',
    );
    // The monto is the saldo to pay: it is shown, not edited.
    const [monto, setMonto] = useState<string>(defaultMonto);
    const [conCuantoPago, setConCuantoPago] = useState<string>('');

    const cambio = useMemo(() => {
        const montoNum = Number(monto) || 0;
        const conCuantoNum = Number(conCuantoPago) || montoNum;

        return Math.max(conCuantoNum - montoNum, 0);
    }, [monto, conCuantoPago]);

    // Paying less than the monto registers a partial abono of what was paid.
    const abonoParcial =
        Number(conCuantoPago) > 0 && Number(conCuantoPago) < Number(monto)
            ? Number(conCuantoPago)
            : null;

    const resetForm = () => {
        setPucId('');
        setVendedorId(pedido.user_id ? String(pedido.user_id) : '');
        setMonto(defaultMonto);
        setConCuantoPago('');
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                onOpenChange(nextOpen);

                if (!nextOpen) {
                    resetForm();
                }
            }}
        >
            <DialogContent>
                <Form
                    key={String(open)}
                    {...routes.abonos.store.form([pedido.id])}
                    className="space-y-6"
                    onSuccess={() => {
                        onOpenChange(false);
                        resetForm();
                    }}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Registrar pago</DialogTitle>
                                <DialogDescription>
                                    Registra un abono para este pedido.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Método de pago</Label>
                                    <Combobox
                                        options={pucOptions}
                                        value={pucId}
                                        onValueChange={setPucId}
                                        searchPlaceholder="Buscar método de pago..."
                                        emptyText="No se encontraron métodos de pago."
                                        dataTest="abono-puc"
                                    />
                                    <input
                                        type="hidden"
                                        name="puc_id"
                                        value={pucId}
                                    />
                                    <InputError message={errors.puc_id} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Monto</Label>
                                        <p
                                            data-test="abono-monto"
                                            className="flex h-9 items-center text-sm font-medium"
                                        >
                                            {currencyFormatter.format(
                                                Number(monto) || 0,
                                            )}
                                        </p>
                                        <input
                                            type="hidden"
                                            name="monto"
                                            value={monto}
                                        />
                                        <InputError message={errors.monto} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="con_cuanto_pago">
                                            Con cuánto pagó
                                        </Label>
                                        <Input
                                            id="con_cuanto_pago"
                                            name="con_cuanto_pago"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            data-test="abono-con-cuanto-pago"
                                            value={conCuantoPago}
                                            onChange={(event) =>
                                                setConCuantoPago(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errors.con_cuanto_pago}
                                        />
                                    </div>
                                </div>

                                <div className="bg-muted flex items-center justify-between rounded-md px-3 py-2 text-sm">
                                    <span className="text-muted-foreground">
                                        Cambio
                                    </span>
                                    <span className="font-medium">
                                        {currencyFormatter.format(cambio)}
                                    </span>
                                </div>

                                {abonoParcial !== null ? (
                                    <p
                                        data-test="abono-parcial"
                                        className="text-sm text-amber-600 dark:text-amber-400"
                                    >
                                        Abono parcial: se registrará{' '}
                                        {currencyFormatter.format(abonoParcial)}
                                        .
                                    </p>
                                ) : null}

                                <div className="grid gap-2">
                                    <Label>Vendedor</Label>
                                    <Combobox
                                        options={vendedorOptions}
                                        value={vendedorId}
                                        onValueChange={setVendedorId}
                                        searchPlaceholder="Buscar vendedor..."
                                        emptyText="No se encontraron vendedores."
                                        dataTest="abono-vendedor"
                                    />
                                    <input
                                        type="hidden"
                                        name="vendedor_id"
                                        value={vendedorId}
                                    />
                                    <InputError message={errors.vendedor_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="descripcion">
                                        Observaciones
                                    </Label>
                                    <Input
                                        id="descripcion"
                                        name="descripcion"
                                        data-test="abono-descripcion"
                                    />
                                    <InputError message={errors.descripcion} />
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancelar
                                    </Button>
                                </DialogClose>

                                <Button
                                    type="submit"
                                    variant="destructive"
                                    data-test="abono-submit"
                                    disabled={processing}
                                >
                                    Registrar Pago
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
