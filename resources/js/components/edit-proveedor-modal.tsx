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
import { Separator } from '@/components/ui/separator';
import { update } from '@/routes/proveedores';
import type {
    CategoriaProveedor,
    Proveedor,
    TipoCuentaProveedor,
    TipoProveedor,
} from '@/types';

type Props = {
    teamSlug: string;
    proveedor: Proveedor | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditProveedorModal({
    teamSlug,
    proveedor,
    open,
    onOpenChange,
}: Props) {
    const [tipoProveedor, setTipoProveedor] =
        useState<TipoProveedor>('REMISIONADO');
    const [categoriaProveedor, setCategoriaProveedor] =
        useState<CategoriaProveedor>('NO_DECLARANTE');
    const [tipoCuenta, setTipoCuenta] =
        useState<TipoCuentaProveedor>('AHORRO');
    const [flete, setFlete] = useState(false);
    const [removeImage, setRemoveImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!proveedor) {
            return;
        }

        setTipoProveedor(proveedor.tipo_proveedor);
        setCategoriaProveedor(proveedor.categoria_proveedor);
        setTipoCuenta(proveedor.tipo_cuenta_proveedor ?? 'AHORRO');
        setFlete(proveedor.flete);
        setRemoveImage(false);
    }, [proveedor]);

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

    if (!proveedor) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <Form
                    key={String(open)}
                    {...update.form([teamSlug, proveedor.id])}
                    className="space-y-6"
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Editar proveedor</DialogTitle>
                                <DialogDescription>
                                    Actualiza la información del proveedor.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_nombre_proveedor">
                                            Nombre
                                        </Label>
                                        <Input
                                            id="edit_nombre_proveedor"
                                            name="nombre_proveedor"
                                            data-test="edit-proveedor-nombre"
                                            defaultValue={
                                                proveedor.nombre_proveedor
                                            }
                                            required
                                        />
                                        <InputError
                                            message={errors.nombre_proveedor}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_razon_social_proveedor">
                                            Razón social
                                        </Label>
                                        <Input
                                            id="edit_razon_social_proveedor"
                                            name="razon_social_proveedor"
                                            defaultValue={
                                                proveedor.razon_social_proveedor ??
                                                ''
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit_nit_proveedor">
                                            NIT
                                        </Label>
                                        <Input
                                            id="edit_nit_proveedor"
                                            name="nit_proveedor"
                                            data-test="edit-proveedor-nit"
                                            defaultValue={
                                                proveedor.nit_proveedor
                                            }
                                            required
                                        />
                                        <InputError
                                            message={errors.nit_proveedor}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Tipo de proveedor</Label>
                                        <Select
                                            value={tipoProveedor}
                                            onValueChange={(value) =>
                                                setTipoProveedor(
                                                    value as TipoProveedor,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="REMISIONADO">
                                                    Remisionado
                                                </SelectItem>
                                                <SelectItem value="ELECTRONICO">
                                                    Electrónico
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <input
                                            type="hidden"
                                            name="tipo_proveedor"
                                            value={tipoProveedor}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Categoría</Label>
                                        <Select
                                            value={categoriaProveedor}
                                            onValueChange={(value) =>
                                                setCategoriaProveedor(
                                                    value as CategoriaProveedor,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DECLARANTE">
                                                    Declarante
                                                </SelectItem>
                                                <SelectItem value="NO_DECLARANTE">
                                                    No declarante
                                                </SelectItem>
                                                <SelectItem value="RETENEDOR">
                                                    Retenedor
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <input
                                            type="hidden"
                                            name="categoria_proveedor"
                                            value={categoriaProveedor}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="text-sm font-medium">
                                        Contacto
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_departamento_proveedor">
                                                Departamento
                                            </Label>
                                            <Input
                                                id="edit_departamento_proveedor"
                                                name="departamento_proveedor"
                                                defaultValue={
                                                    proveedor.departamento_proveedor ??
                                                    ''
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_ciudad_proveedor">
                                                Ciudad
                                            </Label>
                                            <Input
                                                id="edit_ciudad_proveedor"
                                                name="ciudad_proveedor"
                                                defaultValue={
                                                    proveedor.ciudad_proveedor ??
                                                    ''
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_direccion_proveedor">
                                                Dirección
                                            </Label>
                                            <Input
                                                id="edit_direccion_proveedor"
                                                name="direccion_proveedor"
                                                defaultValue={
                                                    proveedor.direccion_proveedor ??
                                                    ''
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_telefono_proveedor">
                                                Teléfono
                                            </Label>
                                            <Input
                                                id="edit_telefono_proveedor"
                                                name="telefono_proveedor"
                                                defaultValue={
                                                    proveedor.telefono_proveedor ??
                                                    ''
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="text-sm font-medium">
                                        Datos bancarios
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_banco_proveedor">
                                                Banco
                                            </Label>
                                            <Input
                                                id="edit_banco_proveedor"
                                                name="banco_proveedor"
                                                defaultValue={
                                                    proveedor.banco_proveedor ??
                                                    ''
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Tipo de cuenta</Label>
                                            <Select
                                                value={tipoCuenta}
                                                onValueChange={(value) =>
                                                    setTipoCuenta(
                                                        value as TipoCuentaProveedor,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="AHORRO">
                                                        Ahorro
                                                    </SelectItem>
                                                    <SelectItem value="CORRIENTE">
                                                        Corriente
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="hidden"
                                                name="tipo_cuenta_proveedor"
                                                value={tipoCuenta}
                                            />
                                        </div>

                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="edit_numero_cuenta_proveedor">
                                                Número de cuenta
                                            </Label>
                                            <Input
                                                id="edit_numero_cuenta_proveedor"
                                                name="numero_cuenta_proveedor"
                                                defaultValue={
                                                    proveedor.numero_cuenta_proveedor ??
                                                    ''
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="text-sm font-medium">
                                        Comercial
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_convenio">
                                                Convenio
                                            </Label>
                                            <Input
                                                id="edit_convenio"
                                                name="convenio"
                                                defaultValue={
                                                    proveedor.convenio ?? ''
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_tiempo_respuesta">
                                                Tiempo de respuesta
                                            </Label>
                                            <Input
                                                id="edit_tiempo_respuesta"
                                                name="tiempo_respuesta"
                                                defaultValue={
                                                    proveedor.tiempo_respuesta ??
                                                    ''
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_fabricante">
                                                Fabricante
                                            </Label>
                                            <Input
                                                id="edit_fabricante"
                                                name="fabricante"
                                                defaultValue={
                                                    proveedor.fabricante ?? ''
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit_valor_flete">
                                                Valor del flete
                                            </Label>
                                            <Input
                                                id="edit_valor_flete"
                                                name="valor_flete"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                defaultValue={
                                                    proveedor.valor_flete
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 sm:col-span-2">
                                            <Checkbox
                                                checked={flete}
                                                onCheckedChange={(checked) =>
                                                    setFlete(checked === true)
                                                }
                                            />
                                            <input
                                                type="hidden"
                                                name="flete"
                                                value={flete ? '1' : '0'}
                                            />
                                            <Label>Maneja flete</Label>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <ImageDropCropper
                                    label="Imagen del RUT"
                                    value={proveedor.rut_proveedor_imagen_url}
                                    onChange={handleImageChange}
                                    error={errors.rut_proveedor_imagen}
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    name="rut_proveedor_imagen"
                                    className="hidden"
                                />
                                <input
                                    type="hidden"
                                    name="remove_rut_proveedor_imagen"
                                    value={removeImage ? '1' : '0'}
                                />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary">
                                        Cancelar
                                    </Button>
                                </DialogClose>

                                <Button
                                    type="submit"
                                    data-test="edit-proveedor-submit"
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
