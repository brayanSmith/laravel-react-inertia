import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { update } from '@/routes/pucs';
import type { Puc, TipoPuc } from '@/types';

const TIPOS_PUC: { value: TipoPuc; label: string }[] = [
    { value: '1', label: '1 - Activo' },
    { value: '2', label: '2 - Pasivo' },
    { value: '3', label: '3 - Patrimonio' },
    { value: '4', label: '4 - Ingresos' },
    { value: '5', label: '5 - Gastos' },
    { value: '6', label: '6 - Costos de ventas' },
    { value: '7', label: '7 - Costos de producción' },
    { value: '8', label: '8 - Cuentas de orden deudoras' },
    { value: '9', label: '9 - Cuentas de orden acreedoras' },
];

type Props = {
    puc: Puc | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditPucModal({ puc, open, onOpenChange }: Props) {
    const [tipo, setTipo] = useState<TipoPuc>('1');

    useEffect(() => {
        if (puc) {
            setTipo(puc.tipo);
        }
    }, [puc]);

    if (!puc) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <Form
                    key={String(open)}
                    {...update.form([puc.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar cuenta PUC</DialogTitle>
                                <DialogDescription>
                                    Actualiza los datos de esta cuenta.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Tipo</Label>
                                    <Select
                                        value={tipo}
                                        onValueChange={(value) =>
                                            setTipo(value as TipoPuc)
                                        }
                                    >
                                        <SelectTrigger
                                            data-test="edit-puc-tipo"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_PUC.map((t) => (
                                                <SelectItem
                                                    key={t.value}
                                                    value={t.value}
                                                >
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input
                                        type="hidden"
                                        name="tipo"
                                        value={tipo}
                                    />
                                    <InputError message={errors.tipo} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_cuenta">Cuenta</Label>
                                    <Input
                                        id="edit_cuenta"
                                        name="cuenta"
                                        data-test="edit-puc-cuenta"
                                        defaultValue={puc.cuenta}
                                        required
                                    />
                                    <InputError message={errors.cuenta} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_subcuenta">
                                        Subcuenta
                                    </Label>
                                    <Input
                                        id="edit_subcuenta"
                                        name="subcuenta"
                                        data-test="edit-puc-subcuenta"
                                        defaultValue={puc.subcuenta}
                                        required
                                    />
                                    <InputError message={errors.subcuenta} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_concepto">
                                        Concepto
                                    </Label>
                                    <Input
                                        id="edit_concepto"
                                        name="concepto"
                                        data-test="edit-puc-concepto"
                                        defaultValue={puc.concepto}
                                        required
                                    />
                                    <InputError message={errors.concepto} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_descripcion">
                                        Descripción
                                    </Label>
                                    <Input
                                        id="edit_descripcion"
                                        name="descripcion"
                                        defaultValue={puc.descripcion ?? ''}
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
                                    data-test="edit-puc-submit"
                                    disabled={processing}
                                >
                                    Guardar cambios
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
