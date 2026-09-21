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
import { store } from '@/routes/stock-iniciales';
import type { Bodega, ProductoOption } from '@/types';

type Props = PropsWithChildren<{
    productos: ProductoOption[];
    bodegas: Bodega[];
}>;

export default function CreateStockInicialModal({
    productos,
    bodegas,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const [productoId, setProductoId] = useState<string>('');
    const [bodegaId, setBodegaId] = useState<string>('');

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

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setProductoId('');
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
                                <DialogTitle>Nuevo stock inicial</DialogTitle>
                                <DialogDescription>
                                    Registra el stock inicial de un producto en
                                    una bodega.
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
                                    <Label htmlFor="cantidad">Cantidad</Label>
                                    <Input
                                        id="cantidad"
                                        name="cantidad"
                                        type="number"
                                        step="1"
                                        min="0"
                                        data-test="create-stock-inicial-cantidad"
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
                                    data-test="create-stock-inicial-submit"
                                    disabled={processing}
                                >
                                    Crear stock inicial
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
