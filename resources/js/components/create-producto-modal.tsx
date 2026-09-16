import { Form } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import ImageDropCropper from '@/components/image-drop-cropper';
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
import { Textarea } from '@/components/ui/textarea';
import { store } from '@/routes/productos';
import type { CategoriaWithSubCategorias } from '@/types';

type Props = PropsWithChildren<{
    currentTeamSlug: string;
    categorias: CategoriaWithSubCategorias[];
}>;

export default function CreateProductoModal({
    children,
    currentTeamSlug,
    categorias,
}: Props) {
    const [open, setOpen] = useState(false);
    const [imagenFile, setImagenFile] = useState<File | null>(null);
    const [categoriaId, setCategoriaId] = useState('');
    const [subCategoriaId, setSubCategoriaId] = useState('');

    const selectedCategoria = categorias.find(
        (categoria) => String(categoria.id) === categoriaId,
    );

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setImagenFile(null);
            setCategoriaId('');
            setSubCategoriaId('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <Form
                    key={String(open)}
                    {...store.form(currentTeamSlug)}
                    transform={(data) =>
                        imagenFile ? { ...data, imagen: imagenFile } : data
                    }
                    className="space-y-6"
                    onStart={() => handleOpenChange(false)}
                    onError={(errors) => {
                        const message =
                            Object.values(errors)[0] ??
                            'No se pudo crear el producto.';
                        toast.error(message);
                    }}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Nuevo producto</DialogTitle>
                                <DialogDescription>
                                    Agrega un nuevo producto a tu inventario.
                                </DialogDescription>
                            </DialogHeader>

                            <ImageDropCropper
                                label="Imagen del producto"
                                onChange={(file) => setImagenFile(file)}
                                error={errors.imagen}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="categoria_id">
                                        Categoría
                                    </Label>
                                    <Select
                                        name="categoria_id"
                                        value={categoriaId}
                                        onValueChange={(value) => {
                                            setCategoriaId(value);
                                            setSubCategoriaId('');
                                        }}
                                        required
                                    >
                                        <SelectTrigger
                                            id="categoria_id"
                                            data-test="producto-categoria"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categorias.map((categoria) => (
                                                <SelectItem
                                                    key={categoria.id}
                                                    value={String(categoria.id)}
                                                >
                                                    {categoria.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.categoria_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="sub_categoria_id">
                                        Subcategoría
                                    </Label>
                                    <Select
                                        name="sub_categoria_id"
                                        value={subCategoriaId}
                                        onValueChange={setSubCategoriaId}
                                        disabled={!selectedCategoria}
                                        required
                                    >
                                        <SelectTrigger
                                            id="sub_categoria_id"
                                            data-test="producto-sub-categoria"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Selecciona una subcategoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(
                                                selectedCategoria?.sub_categorias ??
                                                []
                                            ).map((subCategoria) => (
                                                <SelectItem
                                                    key={subCategoria.id}
                                                    value={String(
                                                        subCategoria.id,
                                                    )}
                                                >
                                                    {subCategoria.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.sub_categoria_id}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="codigo">Código</Label>
                                    <Input
                                        id="codigo"
                                        name="codigo"
                                        data-test="producto-codigo"
                                        placeholder="PRD-00001"
                                        required
                                    />
                                    <InputError message={errors.codigo} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="nombre">Nombre</Label>
                                    <Input
                                        id="nombre"
                                        name="nombre"
                                        data-test="producto-nombre"
                                        placeholder="Nombre del producto"
                                        required
                                    />
                                    <InputError message={errors.nombre} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="descripcion">Descripción</Label>
                                <Textarea
                                    id="descripcion"
                                    name="descripcion"
                                    data-test="producto-descripcion"
                                    placeholder="Descripción del producto"
                                />
                                <InputError message={errors.descripcion} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="costo">Costo</Label>
                                    <Input
                                        id="costo"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="costo"
                                        data-test="producto-costo"
                                        placeholder="0.00"
                                        required
                                    />
                                    <InputError message={errors.costo} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="precio_detal">
                                        Precio detal
                                    </Label>
                                    <Input
                                        id="precio_detal"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="precio_detal"
                                        data-test="producto-precio-detal"
                                        placeholder="0.00"
                                        required
                                    />
                                    <InputError message={errors.precio_detal} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="precio_mayorista">
                                        Precio mayorista
                                    </Label>
                                    <Input
                                        id="precio_mayorista"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="precio_mayorista"
                                        data-test="producto-precio-mayorista"
                                        placeholder="0.00"
                                        required
                                    />
                                    <InputError
                                        message={errors.precio_mayorista}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="precio_especial">
                                        Precio especial
                                    </Label>
                                    <Input
                                        id="precio_especial"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="precio_especial"
                                        data-test="producto-precio-especial"
                                        placeholder="0.00"
                                        required
                                    />
                                    <InputError
                                        message={errors.precio_especial}
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
                                    data-test="create-producto-submit"
                                    disabled={processing}
                                >
                                    Crear producto
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
