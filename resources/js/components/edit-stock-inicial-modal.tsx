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
import { update } from '@/routes/stock-iniciales';
import type { Bodega, ProductoOption, StockInicial } from '@/types';

type Props = {
    teamSlug: string;
    productos: ProductoOption[];
    bodegas: Bodega[];
    stockInicial: StockInicial | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditStockInicialModal({
    teamSlug,
    productos,
    bodegas,
    stockInicial,
    open,
    onOpenChange,
}: Props) {
    const [productoId, setProductoId] = useState<string>(
        stockInicial ? String(stockInicial.producto_id) : '',
    );
    const [bodegaId, setBodegaId] = useState<string>(
        stockInicial ? String(stockInicial.bodega_id) : '',
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

    if (!stockInicial) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                onOpenChange(nextOpen);

                if (nextOpen) {
                    setProductoId(String(stockInicial.producto_id));
                    setBodegaId(String(stockInicial.bodega_id));
                }
            }}
        >
            <DialogContent>
                <Form
                    key={String(open)}
                    {...update.form([teamSlug, stockInicial.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar stock inicial</DialogTitle>
                                <DialogDescription>
                                    Actualiza el stock inicial del producto.
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

                                <div className="grid gap-2">
                                    <Label>Bodega</Label>
                                    <Combobox
                                        options={bodegaOptions}
                                        value={bodegaId}
                                        onValueChange={setBodegaId}
                                        placeholder="Seleccione una bodega..."
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

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_cantidad">
                                        Cantidad
                                    </Label>
                                    <Input
                                        id="edit_cantidad"
                                        name="cantidad"
                                        type="number"
                                        step="1"
                                        min="0"
                                        data-test="edit-stock-inicial-cantidad"
                                        defaultValue={stockInicial.cantidad}
                                        required
                                    />
                                    <InputError message={errors.cantidad} />
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
                                    data-test="edit-stock-inicial-submit"
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
