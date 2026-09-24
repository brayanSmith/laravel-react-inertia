import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import Combobox from '@/components/combobox';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { PosAbono, PosNewAbono } from '@/hooks/use-pos-abonos';
import type { PosHeaderState } from '@/hooks/use-pos-header';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { calcularTotales } from '@/lib/pos-totals';
import { cn } from '@/lib/utils';
import type { PucOption, TipoPagoPedido } from '@/types';

/** The id of the checkout `<form>`; the submit button lives in this modal. */
export const POS_CHECKOUT_FORM_ID = 'pos-checkout-form';

type Props = {
    header: PosHeaderState;
    onFieldChange: <K extends keyof PosHeaderState>(
        key: K,
        value: PosHeaderState[K],
    ) => void;
    totalBruto: number;
    pucs: PucOption[];
    abonos: PosAbono[];
    onAddAbono: (abono: PosNewAbono) => void;
    onRemoveAbono: (id: number) => void;
    totalAbonado: number;
    /** Read-only list built from the abonos' descriptions. */
    observacionPago: string;
    errors: Partial<Record<string, string>>;
    processing: boolean;
    onClose: () => void;
};

const TIPOS_PAGO: { value: TipoPagoPedido; label: string }[] = [
    { value: 'CONTADO', label: 'Contado' },
    { value: 'SEPARADO', label: 'Separado' },
    { value: 'CREDITO', label: 'Crédito' },
];

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

/**
 * Checkout step ("Proceder al Pago"): how the sale is paid (tipo de pago),
 * the adjustments (descuento, flete, reteica, retefuente), the resulting
 * total to pay and the payments (abonos) collected now. Submitting it
 * submits the POS form.
 */
export default function PosPagoModal({
    header,
    onFieldChange,
    totalBruto,
    pucs,
    abonos,
    onAddAbono,
    onRemoveAbono,
    totalAbonado,
    observacionPago,
    errors,
    processing,
    onClose,
}: Props) {
    const finalizarRef = useRef<HTMLButtonElement>(null);
    // F9 finalizes (the button ignores it while it is disabled).
    useHotkeys([{ key: 'F9', handler: () => finalizarRef.current?.click() }]);

    const [pucId, setPucId] = useState('');
    const [conCuantoPago, setConCuantoPago] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const { total } = calcularTotales(totalBruto, header);
    const saldo = Math.max(total - totalAbonado, 0);
    const errorMessages = useMemo(
        () => Object.values(errors).filter(Boolean),
        [errors],
    );

    const pucOptions = useMemo(
        () =>
            pucs.map((item) => ({
                value: String(item.id),
                label:
                    item.concatenar_subcuenta_concepto ?? `Cuenta ${item.id}`,
            })),
        [pucs],
    );

    const puc = pucs.find((item) => String(item.id) === pucId);
    // The monto is calculated, not typed: what the customer pays now
    // ("Paga con", capped at the balance), or the whole balance when
    // "Paga con" is empty.
    const pagaConNum = Number(conCuantoPago) || 0;
    const montoNum = pagaConNum > 0 ? Math.min(pagaConNum, saldo) : saldo;
    const conCuantoNum = pagaConNum > 0 ? pagaConNum : montoNum;
    const cambioPreview = Math.max(conCuantoNum - montoNum, 0);
    const sobrepagado = totalAbonado > total;
    const canAddAbono = Boolean(puc) && montoNum > 0;

    const handleAddAbono = () => {
        if (!puc || !canAddAbono) {
            return;
        }

        onAddAbono({
            pucId: puc.id,
            pucNombre: puc.concatenar_subcuenta_concepto ?? `Cuenta ${puc.id}`,
            monto: montoNum,
            conCuantoPago: conCuantoNum,
            descripcion: descripcion.trim(),
        });
        setConCuantoPago('');
        setDescripcion('');
    };

    const numberField = (
        key: 'descuento' | 'flete' | 'reteica' | 'retefuente',
        label: string,
    ) => (
        <div className="grid gap-2">
            <Label htmlFor={`pos-pago-${key}`}>{label}</Label>
            <Input
                id={`pos-pago-${key}`}
                type="number"
                min={0}
                value={header[key]}
                onChange={(event) => onFieldChange(key, event.target.value)}
                data-test={`pos-pago-${key}`}
            />
        </div>
    );

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="w-full max-w-none p-4 sm:w-[calc(100%-1.5rem)] sm:max-w-2xl sm:p-6"
                data-test="pos-pago-modal"
            >
                <DialogHeader>
                    <DialogTitle>Proceder al pago</DialogTitle>
                    <DialogDescription>
                        Confirma cómo se paga la venta antes de finalizarla.
                    </DialogDescription>
                </DialogHeader>

                {errorMessages.length > 0 ? (
                    <ul className="bg-destructive/10 text-destructive list-disc rounded-md p-3 pl-6 text-sm">
                        {errorMessages.map((message) => (
                            <li key={message}>{message}</li>
                        ))}
                    </ul>
                ) : null}

                <div className="grid gap-2">
                    <Label>Tipo de pago</Label>
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={header.tipoPago}
                        onValueChange={(value) => {
                            if (value) {
                                onFieldChange(
                                    'tipoPago',
                                    value as TipoPagoPedido,
                                );
                            }
                        }}
                        className="flex-wrap justify-start"
                        data-test="pos-pago-tipo"
                    >
                        {TIPOS_PAGO.map((tipo) => (
                            <ToggleGroupItem
                                key={tipo.value}
                                value={tipo.value}
                                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
                            >
                                {tipo.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {numberField('descuento', 'Descuento')}
                    {numberField('flete', 'Flete')}
                    {numberField('reteica', 'Reteica')}
                    {numberField('retefuente', 'Retefuente')}
                </div>

                <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                    <span className="text-muted-foreground text-sm">
                        Total Bruto: {currencyFormatter.format(totalBruto)}
                    </span>
                    <span className="text-lg font-semibold">
                        Total a pagar: {currencyFormatter.format(total)}
                    </span>
                </div>

                <div className="grid gap-4 rounded-md border p-4">
                    <p className="text-sm font-semibold">Abonos</p>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="grid min-w-0 gap-2 md:col-span-2">
                            <Label>Método de pago</Label>
                            <Combobox
                                // A long name wraps onto more lines instead of widening the modal.
                                className="h-auto min-h-9 whitespace-normal [&>span]:line-clamp-none [&>span]:min-w-0 [&>span]:break-words"
                                options={pucOptions}
                                value={pucId}
                                onValueChange={setPucId}
                                searchPlaceholder="Buscar método de pago..."
                                emptyText="No se encontraron métodos de pago."
                                dataTest="pos-abono-puc"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Monto</Label>
                            <div
                                className="bg-muted/40 flex h-9 items-center rounded-md border px-3 text-sm font-semibold"
                                data-test="pos-abono-monto"
                            >
                                {currencyFormatter.format(montoNum)}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="pos-abono-con-cuanto">
                                Paga con
                            </Label>
                            <Input
                                id="pos-abono-con-cuanto"
                                type="number"
                                min={0}
                                value={conCuantoPago}
                                placeholder={String(montoNum)}
                                onChange={(event) =>
                                    setConCuantoPago(event.target.value)
                                }
                                data-test="pos-abono-con-cuanto"
                            />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="pos-abono-descripcion">
                                Descripción
                            </Label>
                            <Input
                                id="pos-abono-descripcion"
                                value={descripcion}
                                placeholder="Referencia del pago, banco, nota..."
                                onChange={(event) =>
                                    setDescripcion(event.target.value)
                                }
                                data-test="pos-abono-descripcion"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground text-sm">
                            Cambio: {currencyFormatter.format(cambioPreview)}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!canAddAbono}
                            onClick={handleAddAbono}
                            data-test="pos-abono-agregar"
                        >
                            <Plus /> Agregar abono
                        </Button>
                    </div>

                    {abonos.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {abonos.map((abono) => (
                                <div
                                    key={abono.id}
                                    className="bg-muted/40 grid gap-1 rounded-md border p-3 text-sm"
                                    data-test="pos-abono-item"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="font-medium break-words">
                                            {abono.pucNombre}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="-mt-1 -mr-2 shrink-0"
                                            onClick={() =>
                                                onRemoveAbono(abono.id)
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                    <span className="text-lg font-semibold">
                                        {currencyFormatter.format(abono.monto)}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        Paga con{' '}
                                        {currencyFormatter.format(
                                            abono.conCuantoPago,
                                        )}{' '}
                                        · Cambio{' '}
                                        {currencyFormatter.format(
                                            abono.conCuantoPago - abono.monto,
                                        )}
                                    </span>
                                    {abono.descripcion ? (
                                        <span className="text-muted-foreground text-xs break-words">
                                            {abono.descripcion}
                                        </span>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            Sin abonos: el pedido quedará pendiente de pago.
                        </p>
                    )}

                    <div className="grid gap-1 border-t pt-3 text-sm sm:grid-cols-3">
                        <span>
                            Total a pagar:{' '}
                            <strong>{currencyFormatter.format(total)}</strong>
                        </span>
                        <span>
                            Abonado:{' '}
                            <strong>
                                {currencyFormatter.format(totalAbonado)}
                            </strong>
                        </span>
                        <span className={cn(sobrepagado && 'text-destructive')}>
                            Saldo pendiente:{' '}
                            <strong>{currencyFormatter.format(saldo)}</strong>
                        </span>
                        {sobrepagado ? (
                            <span className="text-destructive sm:col-span-3">
                                Los abonos superan el total a pagar por{' '}
                                {currencyFormatter.format(totalAbonado - total)}
                                ; elimina o reduce un abono.
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="pos-observacion-pago">
                        Observación de pago
                    </Label>
                    <Textarea
                        id="pos-observacion-pago"
                        rows={Math.max(observacionPago.split('\n').length, 2)}
                        value={observacionPago}
                        readOnly
                        placeholder="Se llena con las descripciones de los abonos."
                        className="bg-muted/40"
                        data-test="pos-observacion-pago"
                    />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Volver
                    </Button>
                    <Button
                        ref={finalizarRef}
                        type="submit"
                        form={POS_CHECKOUT_FORM_ID}
                        disabled={processing || sobrepagado}
                        data-test="pos-facturar"
                    >
                        Finalizar venta
                        <kbd className="text-xs opacity-70">F9</kbd>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
