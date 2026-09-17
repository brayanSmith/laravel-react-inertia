import { Form } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
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
import { update } from '@/routes/clientes';
import type { Cliente, RetenedorFuente, TipoDocumento } from '@/types';

const TIPOS_DOCUMENTO: TipoDocumento[] = ['CC', 'NIT', 'CE', 'TI', 'PASAPORTE'];

type Props = {
    teamSlug: string;
    cliente: Cliente | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditClienteModal({
    teamSlug,
    cliente,
    open,
    onOpenChange,
}: Props) {
    const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('CC');
    const [retenedorFuente, setRetenedorFuente] =
        useState<RetenedorFuente>('NO');
    const [activo, setActivo] = useState(true);
    const [removeImage, setRemoveImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!cliente) {
            return;
        }

        setTipoDocumento(cliente.tipo_documento);
        setRetenedorFuente(cliente.retenedor_fuente);
        setActivo(cliente.activo);
        setRemoveImage(false);
    }, [cliente]);

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

    if (!cliente) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <Form
                    key={String(open)}
                    {...update.form([teamSlug, cliente.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar cliente</DialogTitle>
                                <DialogDescription>
                                    Actualiza la información del cliente.
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
                                            data-test="edit-cliente-tipo-documento"
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
                                    <Label htmlFor="edit_numero_documento">
                                        Número de documento
                                    </Label>
                                    <Input
                                        id="edit_numero_documento"
                                        name="numero_documento"
                                        data-test="edit-cliente-numero-documento"
                                        defaultValue={cliente.numero_documento}
                                        required
                                    />
                                    <InputError
                                        message={errors.numero_documento}
                                    />
                                </div>

                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="edit_razon_social">
                                        Razón social
                                    </Label>
                                    <Input
                                        id="edit_razon_social"
                                        name="razon_social"
                                        data-test="edit-cliente-razon-social"
                                        defaultValue={cliente.razon_social}
                                        required
                                    />
                                    <InputError message={errors.razon_social} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_direccion">
                                        Dirección
                                    </Label>
                                    <Input
                                        id="edit_direccion"
                                        name="direccion"
                                        defaultValue={cliente.direccion ?? ''}
                                    />
                                    <InputError message={errors.direccion} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_telefono">
                                        Teléfono
                                    </Label>
                                    <Input
                                        id="edit_telefono"
                                        name="telefono"
                                        defaultValue={cliente.telefono ?? ''}
                                    />
                                    <InputError message={errors.telefono} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_ciudad">Ciudad</Label>
                                    <Input
                                        id="edit_ciudad"
                                        name="ciudad"
                                        defaultValue={cliente.ciudad ?? ''}
                                    />
                                    <InputError message={errors.ciudad} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit_email">Email</Label>
                                    <Input
                                        id="edit_email"
                                        name="email"
                                        type="email"
                                        defaultValue={cliente.email ?? ''}
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
                                            data-test="edit-cliente-retenedor-fuente"
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
                                    <Label htmlFor="edit_novedad">
                                        Novedad
                                    </Label>
                                    <Input
                                        id="edit_novedad"
                                        name="novedad"
                                        defaultValue={cliente.novedad ?? ''}
                                    />
                                    <InputError message={errors.novedad} />
                                </div>

                                <div className="sm:col-span-2">
                                    <ImageDropCropper
                                        label="Imagen del RUT"
                                        value={cliente.rut_imagen_url}
                                        onChange={handleImageChange}
                                        error={errors.rut_imagen}
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        name="rut_imagen"
                                        className="hidden"
                                    />
                                    <input
                                        type="hidden"
                                        name="remove_rut_imagen"
                                        value={removeImage ? '1' : '0'}
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
                                    data-test="edit-cliente-submit"
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
