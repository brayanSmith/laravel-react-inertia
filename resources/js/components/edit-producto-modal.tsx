import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
import { update } from '@/routes/productos';
import type { CategoriaWithSubCategorias, Producto } from '@/types';

type Props = {
    currentTeamSlug: string;
    producto: Producto | null;
    categorias: CategoriaWithSubCategorias[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditProductoModal({
    currentTeamSlug,
    producto,
    categorias,
    open,
    onOpenChange,
}: Props) {
    const [imagenFile, setImagenFile] = useState<File | null>(null);
    const [imagenRemoved, setImagenRemoved] = useState(false);
    const [categoriaId, setCategoriaId] = useState('');
    const [subCategoriaId, setSubCategoriaId] = useState('');

    useEffect(() => {
        setCategoriaId(producto ? String(producto.categoria_id) : '');
        setSubCategoriaId(producto ? String(producto.sub_categoria_id) : '');
    }, [producto]);

    const selectedCategoria = categorias.find(
        (categoria) => String(categoria.id) === categoriaId,
    );

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
            setImagenFile(null);
            setImagenRemoved(false);
        }
    };

    const handleImageChange = (file: File | null, removed: boolean) => {
        setImagenFile(file);
        setImagenRemoved(removed);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                {producto ? (
                    <Form
                        key={producto.id}
                        {...update.form([currentTeamSlug, producto.id])}
                        transform={(data) => ({
                            ...data,
                            ...(imagenFile ? { imagen: imagenFile } : {}),
                            ...(imagenRemoved
                                ? { remove_imagen: '1' as const }
                                : {}),
                        })}
                        className="space-y-6"
                        onSuccess={() => handleOpenChange(false)}
                    >
                        {({ errors, processing }) => (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Editar producto</DialogTitle>
                                    <DialogDescription>
                                        Actualiza la información de{' '}
                                        {producto.nombre}.
                                    </DialogDescription>
                                </DialogHeader>

                                <ImageDropCropper
                                    label="Imagen del producto"
                                    value={
                                        imagenRemoved
                                            ? null
                                            : (producto.imagen ?? null)
                                    }
                                    onChange={handleImageChange}
                                    error={errors.imagen}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-categoria_id">
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
                                                id="edit-categoria_id"
                                                data-test="edit-producto-categoria"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Selecciona una categoría" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categorias.map((categoria) => (
                                                    <SelectItem
                                                        key={categoria.id}
                                                        value={String(
                                                            categoria.id,
                                                        )}
                                                    >
                                                        {categoria.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.categoria_id}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-sub_categoria_id">
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
                                                id="edit-sub_categoria_id"
                                                data-test="edit-producto-sub-categoria"
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
                                        <Label htmlFor="edit-codigo">
                                            Código
                                        </Label>
                                        <Input
                                            id="edit-codigo"
                                            name="codigo"
                                            data-test="edit-producto-codigo"
                                            defaultValue={producto.codigo}
                                            required
                                        />
                                        <InputError message={errors.codigo} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-nombre">
                                            Nombre
                                        </Label>
                                        <Input
                                            id="edit-nombre"
                                            name="nombre"
                                            data-test="edit-producto-nombre"
                                            defaultValue={producto.nombre}
                                            required
                                        />
                                        <InputError message={errors.nombre} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-descripcion">
                                        Descripción
                                    </Label>
                                    <Textarea
                                        id="edit-descripcion"
                                        name="descripcion"
                                        data-test="edit-producto-descripcion"
                                        defaultValue={
                                            producto.descripcion ?? ''
                                        }
                                    />
                                    <InputError message={errors.descripcion} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-costo">
                                            Costo
                                        </Label>
                                        <Input
                                            id="edit-costo"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="costo"
                                            data-test="edit-producto-costo"
                                            defaultValue={producto.costo}
                                            required
                                        />
                                        <InputError message={errors.costo} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-precio_detal">
                                            Precio detal
                                        </Label>
                                        <Input
                                            id="edit-precio_detal"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="precio_detal"
                                            data-test="edit-producto-precio-detal"
                                            defaultValue={producto.precio_detal}
                                            required
                                        />
                                        <InputError
                                            message={errors.precio_detal}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-precio_mayorista">
                                            Precio mayorista
                                        </Label>
                                        <Input
                                            id="edit-precio_mayorista"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="precio_mayorista"
                                            data-test="edit-producto-precio-mayorista"
                                            defaultValue={
                                                producto.precio_mayorista
                                            }
                                            required
                                        />
                                        <InputError
                                            message={errors.precio_mayorista}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-precio_especial">
                                            Precio especial
                                        </Label>
                                        <Input
                                            id="edit-precio_especial"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="precio_especial"
                                            data-test="edit-producto-precio-especial"
                                            defaultValue={
                                                producto.precio_especial
                                            }
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
                                        data-test="edit-producto-submit"
                                        disabled={processing}
                                    >
                                        Guardar cambios
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
