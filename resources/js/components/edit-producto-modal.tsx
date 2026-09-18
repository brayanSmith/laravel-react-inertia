import { Form } from '@inertiajs/react';
import { useRef, useState } from 'react';
import ProductoFormFields from '@/components/producto-form-fields';
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
import { update } from '@/routes/productos';
import type { MarcaOption, Producto } from '@/types';

type Props = {
    teamSlug: string;
    marcas: MarcaOption[];
    producto: Producto | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditProductoModal({
    teamSlug,
    marcas,
    producto,
    open,
    onOpenChange,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [removeImage, setRemoveImage] = useState(false);

    const handleImageChange = (file: File | null, removed: boolean) => {
        setRemoveImage(removed);

        if (!fileInputRef.current) {
            return;
        }

        const dataTransfer = new DataTransfer();

        if (file) {
            dataTransfer.items.add(file);
        }

        fileInputRef.current.files = dataTransfer.files;
    };

    if (!producto) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-3xl lg:max-w-5xl">
                <Form
                    key={`${producto.id}-${String(open)}`}
                    {...update.form([teamSlug, producto.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar producto</DialogTitle>
                                <DialogDescription>
                                    Actualiza los datos del producto.
                                </DialogDescription>
                            </DialogHeader>

                            <ProductoFormFields
                                producto={producto}
                                marcas={marcas}
                                errors={errors}
                                onImageChange={handleImageChange}
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                name="imagen_producto"
                                className="hidden"
                            />
                            <input
                                type="hidden"
                                name="remove_imagen_producto"
                                value={removeImage ? '1' : '0'}
                            />

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancelar
                                    </Button>
                                </DialogClose>

                                <Button
                                    type="submit"
                                    data-test="producto-submit"
                                    disabled={processing}
                                >
                                    Guardar Producto
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
