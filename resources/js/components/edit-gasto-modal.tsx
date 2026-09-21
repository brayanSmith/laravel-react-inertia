import { Form } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
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
import { update } from '@/routes/gastos';
import type { Bodega, Gasto } from '@/types';

type Props = {
    bodegas: Bodega[];
    gasto: Gasto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditGastoModal({
    bodegas,
    gasto,
    open,
    onOpenChange,
}: Props) {
    const [bodegaId, setBodegaId] = useState<string>(
        gasto?.bodega_id ? String(gasto.bodega_id) : '',
    );

    // The modal is mounted before a gasto is picked, so follow the selected one.
    useEffect(() => {
        setBodegaId(gasto?.bodega_id ? String(gasto.bodega_id) : '');
    }, [gasto]);

    const bodegaOptions = useMemo(
        () =>
            bodegas.map((bodega) => ({
                value: String(bodega.id),
                label: bodega.nombre_bodega,
            })),
        [bodegas],
    );

    if (!gasto) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                onOpenChange(nextOpen);

                if (nextOpen) {
                    setBodegaId(gasto.bodega_id ? String(gasto.bodega_id) : '');
                }
            }}
        >
            <DialogContent>
                <Form
                    key={String(open)}
                    {...update.form([gasto.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar gasto</DialogTitle>
                                <DialogDescription>
                                    Actualiza los datos del gasto.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_descripcion">
                                        Descripción
                                    </Label>
                                    <Input
                                        id="edit_descripcion"
                                        name="descripcion"
                                        data-test="edit-gasto-descripcion"
                                        defaultValue={gasto.descripcion}
                                        required
                                    />
                                    <InputError message={errors.descripcion} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_monto">
                                            Monto
                                        </Label>
                                        <Input
                                            id="edit_monto"
                                            name="monto"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            data-test="edit-gasto-monto"
                                            defaultValue={gasto.monto}
                                            required
                                        />
                                        <InputError message={errors.monto} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_fecha_gasto">
                                            Fecha
                                        </Label>
                                        <Input
                                            id="edit_fecha_gasto"
                                            name="fecha_gasto"
                                            type="date"
                                            data-test="edit-gasto-fecha"
                                            defaultValue={gasto.fecha_gasto.slice(
                                                0,
                                                10,
                                            )}
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
                                    data-test="edit-gasto-submit"
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
