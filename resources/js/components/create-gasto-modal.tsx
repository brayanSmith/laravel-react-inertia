import { Form } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/gastos';
import type { Bodega } from '@/types';

type Props = PropsWithChildren<{
    bodegas: Bodega[];
}>;

export default function CreateGastoModal({ bodegas, children }: Props) {
    const [open, setOpen] = useState(false);
    const [bodegaId, setBodegaId] = useState<string>('');

    const bodegaOptions = useMemo(
        () =>
            bodegas.map((bodega) => ({
                value: String(bodega.id),
                label: bodega.nombre_bodega,
            })),
        [bodegas],
    );

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setBodegaId('');
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
                                <DialogTitle>Nuevo gasto</DialogTitle>
                                <DialogDescription>
                                    Registra un nuevo gasto.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="descripcion">
                                        Descripción
                                    </Label>
                                    <Input
                                        id="descripcion"
                                        name="descripcion"
                                        data-test="create-gasto-descripcion"
                                        required
                                    />
                                    <InputError message={errors.descripcion} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="monto">Monto</Label>
                                        <Input
                                            id="monto"
                                            name="monto"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            data-test="create-gasto-monto"
                                            required
                                        />
                                        <InputError message={errors.monto} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="fecha_gasto">
                                            Fecha
                                        </Label>
                                        <Input
                                            id="fecha_gasto"
                                            name="fecha_gasto"
                                            type="date"
                                            data-test="create-gasto-fecha"
                                            required
                                        />
                                        <InputError
                                            message={errors.fecha_gasto}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Bodega</Label>
                                    <Combobox
                                        options={bodegaOptions}
                                        value={bodegaId}
                                        onValueChange={setBodegaId}
                                        placeholder="Sin bodega"
                                        searchPlaceholder="Buscar bodega..."
                                        emptyText="No se encontraron bodegas."
                                    />
                                    <input
                                        type="hidden"
                                        name="bodega_id"
                                        value={bodegaId}
                                    />
                                    <InputError message={errors.bodega_id} />
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
                                    data-test="create-gasto-submit"
                                    disabled={processing}
                                >
                                    Crear gasto
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
