import { Form } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { store } from '@/routes/productos';
import type { MarcaOption } from '@/types';

type Props = PropsWithChildren<{
    marcas: MarcaOption[];
    /** Keep the user on the current screen after saving (e.g. the POS). */
    stayOnPage?: boolean;
}>;

export default function CreateProductoModal({
    marcas,
    stayOnPage = false,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (file: File | null) => {
        if (!fileInputRef.current) {
            return;
        }

        const dataTransfer = new DataTransfer();

        if (file) {
            dataTransfer.items.add(file);
        }

        fileInputRef.current.files = dataTransfer.files;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-3xl lg:max-w-5xl">
                <Form
                    key={String(open)}
                    {...store.form()}
                    className="space-y-6"
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Nuevo producto</DialogTitle>
                                <DialogDescription>
                                    Registra un nuevo producto en el catálogo.
                                </DialogDescription>
                            </DialogHeader>

                            {stayOnPage ? (
                                <input
                                    type="hidden"
                                    name="stay_on_page"
                                    value="1"
                                />
                            ) : null}

                            <ProductoFormFields
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
