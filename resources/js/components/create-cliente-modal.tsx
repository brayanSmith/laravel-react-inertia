import { Form } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useRef, useState } from 'react';
import ImageDropCropper from '@/components/image-drop-cropper';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { store } from '@/routes/clientes';
import type { RetenedorFuente, TipoDocumento } from '@/types';

const TIPOS_DOCUMENTO: TipoDocumento[] = ['CC', 'NIT', 'CE', 'TI', 'PASAPORTE'];

type Props = PropsWithChildren<{
    /** Called after the cliente was created and the modal closed. */
    onCreated?: () => void;
    /** Created from the POS: the server then accepts `pos.create-cliente` too. */
    fromPos?: boolean;
}>;

export default function CreateClienteModal({
    onCreated,
    fromPos = false,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('CC');
    const [retenedorFuente, setRetenedorFuente] =
        useState<RetenedorFuente>('NO');
    const [activo, setActivo] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setTipoDocumento('CC');
            setRetenedorFuente('NO');
            setActivo(true);
        }
    };

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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <Form
                    key={String(open)}
                    {...store.form()}
                    className="space-y-6"
                    onSuccess={() => {
                        handleOpenChange(false);
                        onCreated?.();
                    }}
                >
                    {({ errors, processing }) => (
                        <>
                            {fromPos ? (
                                <input
                                    type="hidden"
                                    name="desde_pos"
                                    value="1"
                                />
                            ) : null}
                            <DialogHeader>
                                <DialogTitle>Nuevo cliente</DialogTitle>
                                <DialogDescription>
                                    Crea un nuevo cliente con su información de
                                    facturación.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Tipo de documento</Label>
                                    <Select
                                        value={tipoDocumento}
                                        onValueChange={(value) =>
                                            setTipoDocumento(
                                                value as TipoDocumento,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            data-test="create-cliente-tipo-documento"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_DOCUMENTO.map((tipo) => (
                                                <SelectItem
                                                    key={tipo}
                                                    value={tipo}
                                                >
                                                    {tipo}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input
                                        type="hidden"
                                        name="tipo_documento"
                                        value={tipoDocumento}
                                    />
                                    <InputError
                                        message={errors.tipo_documento}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="numero_documento">
                                        Número de documento
                                    </Label>
                                    <Input
                                        id="numero_documento"
                                        name="numero_documento"
                                        data-test="create-cliente-numero-documento"
                                        required
                                    />
                                    <InputError
                                        message={errors.numero_documento}
                                    />
                                </div>

                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="razon_social">
                                        Razón social
                                    </Label>
                                    <Input
                                        id="razon_social"
                                        name="razon_social"
                                        data-test="create-cliente-razon-social"
                                        required
                                    />
                                    <InputError message={errors.razon_social} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="direccion">Dirección</Label>
                                    <Input id="direccion" name="direccion" />
                                    <InputError message={errors.direccion} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input id="telefono" name="telefono" />
                                    <InputError message={errors.telefono} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="ciudad">Ciudad</Label>
                                    <Input id="ciudad" name="ciudad" />
                                    <InputError message={errors.ciudad} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Retenedor de fuente</Label>
                                    <Select
                                        value={retenedorFuente}
                                        onValueChange={(value) =>
                                            setRetenedorFuente(
                                                value as RetenedorFuente,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            data-test="create-cliente-retenedor-fuente"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SI">
                                                Sí
                                            </SelectItem>
                                            <SelectItem value="NO">
                                                No
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <input
                                        type="hidden"
                                        name="retenedor_fuente"
                                        value={retenedorFuente}
                                    />
                                    <InputError
                                        message={errors.retenedor_fuente}
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-6">
                                    <Checkbox
                                        checked={activo}
                                        onCheckedChange={(checked) =>
                                            setActivo(checked === true)
                                        }
                                    />
                                    <input
                                        type="hidden"
                                        name="activo"
                                        value={activo ? '1' : '0'}
                                    />
                                    <Label>Cliente activo</Label>
                                </div>

                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="novedad">Novedad</Label>
                                    <Input id="novedad" name="novedad" />
                                    <InputError message={errors.novedad} />
                                </div>

                                <div className="sm:col-span-2">
                                    <ImageDropCropper
                                        label="Imagen del RUT"
                                        onChange={handleImageChange}
                                        error={errors.rut_imagen}
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        name="rut_imagen"
                                        className="hidden"
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
                                    data-test="create-cliente-submit"
                                    disabled={processing}
                                >
                                    Crear cliente
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
