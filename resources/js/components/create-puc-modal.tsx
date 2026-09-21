import { Form } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
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
    DialogTrigger,
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
import { store } from '@/routes/pucs';
import type { TipoPuc } from '@/types';

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

type Props = PropsWithChildren<{}>;

export default function CreatePucModal({ children }: Props) {
    const [open, setOpen] = useState(false);
    const [tipo, setTipo] = useState<TipoPuc>('1');

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setTipo('1');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <Form
                    key={String(open)}
                    {...store.form()}
                    className="space-y-6"
                    onSuccess={() => handleOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Nueva cuenta PUC</DialogTitle>
                                <DialogDescription>
                                    Crea una nueva cuenta del plan único de
                                    cuentas.
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
                                            data-test="create-puc-tipo"
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
                                    <Label htmlFor="cuenta">Cuenta</Label>
                                    <Input
                                        id="cuenta"
                                        name="cuenta"
                                        data-test="create-puc-cuenta"
                                        required
                                    />
                                    <InputError message={errors.cuenta} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="subcuenta">Subcuenta</Label>
                                    <Input
                                        id="subcuenta"
                                        name="subcuenta"
                                        data-test="create-puc-subcuenta"
                                        required
                                    />
                                    <InputError message={errors.subcuenta} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="concepto">Concepto</Label>
                                    <Input
                                        id="concepto"
                                        name="concepto"
                                        data-test="create-puc-concepto"
                                        required
                                    />
                                    <InputError message={errors.concepto} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="descripcion">
                                        Descripción
                                    </Label>
                                    <Input
                                        id="descripcion"
                                        name="descripcion"
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
                                    data-test="create-puc-submit"
                                    disabled={processing}
                                >
                                    Crear cuenta
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
