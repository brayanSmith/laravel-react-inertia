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
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/traslados';
import type { Bodega, ProductoOption, Traslado } from '@/types';

type Props = {
    productos: ProductoOption[];
    bodegas: Bodega[];
    traslado: Traslado | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditTrasladoModal({
    productos,
    bodegas,
    traslado,
    open,
    onOpenChange,
}: Props) {
    const [productoId, setProductoId] = useState<string>(
        traslado ? String(traslado.producto_id) : '',
    );
    const [bodegaDonanteId, setBodegaDonanteId] = useState<string>(
        traslado ? String(traslado.bodega_donante_id) : '',
    );
    const [bodegaDestinoId, setBodegaDestinoId] = useState<string>(
        traslado ? String(traslado.bodega_destino_id) : '',
    );

    const productoOptions = useMemo(
        () =>
            productos.map((producto) => ({
                value: String(producto.id),
                label:
                    producto.concatenar_codigo_nombre ??
                    producto.referencia_producto ??
                    `Producto ${producto.id}`,
            })),
        [productos],
    );
    const bodegaOptions = useMemo(
        () =>
            bodegas.map((bodega) => ({
                value: String(bodega.id),
                label: bodega.nombre_bodega,
            })),
        [bodegas],
    );

    if (!traslado) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                onOpenChange(nextOpen);

                if (nextOpen) {
                    setProductoId(String(traslado.producto_id));
                    setBodegaDonanteId(String(traslado.bodega_donante_id));
                    setBodegaDestinoId(String(traslado.bodega_destino_id));
                }
            }}
        >
            <DialogContent>
                <Form
                    key={String(open)}
                    {...update.form([traslado.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar traslado</DialogTitle>
                                <DialogDescription>
                                    Actualiza los datos del traslado.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Producto</Label>
                                    <Combobox
                                        options={productoOptions}
                                        value={productoId}
                                        onValueChange={setProductoId}
                                        placeholder="Seleccione un producto..."
                                        searchPlaceholder="Buscar producto..."
                                        emptyText="No se encontraron productos."
                                    />
                                    <input
                                        type="hidden"
                                        name="producto_id"
                                        value={productoId}
                                    />
                                    <InputError message={errors.producto_id} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Bodega donante</Label>
                                        <Combobox
                                            options={bodegaOptions}
                                            value={bodegaDonanteId}
                                            onValueChange={setBodegaDonanteId}
                                            placeholder="Origen..."
                                            searchPlaceholder="Buscar bodega..."
                                            emptyText="No se encontraron bodegas."
                                        />
                                        <input
                                            type="hidden"
                                            name="bodega_donante_id"
                                            value={bodegaDonanteId}
                                        />
                                        <InputError
                                            message={errors.bodega_donante_id}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Bodega destino</Label>
                                        <Combobox
                                            options={bodegaOptions}
                                            value={bodegaDestinoId}
                                            onValueChange={setBodegaDestinoId}
                                            placeholder="Destino..."
                                            searchPlaceholder="Buscar bodega..."
                                            emptyText="No se encontraron bodegas."
                                        />
                                        <input
                                            type="hidden"
                                            name="bodega_destino_id"
                                            value={bodegaDestinoId}
                                        />
                                        <InputError
                                            message={errors.bodega_destino_id}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_cantidad">
                                        Cantidad
                                    </Label>
                                    <Input
                                        id="edit_cantidad"
                                        name="cantidad"
                                        type="number"
                                        step="1"
                                        min="1"
                                        data-test="edit-traslado-cantidad"
                                        defaultValue={traslado.cantidad}
                                        required
                                    />
                                    <InputError message={errors.cantidad} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_observaciones">
                                        Observaciones
                                    </Label>
                                    <Textarea
                                        id="edit_observaciones"
                                        name="observaciones"
                                        data-test="edit-traslado-observaciones"
                                        defaultValue={
                                            traslado.observaciones ?? ''
                                        }
                                    />
                                    <InputError
                                        message={errors.observaciones}
                                    />
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
                                    data-test="edit-traslado-submit"
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
