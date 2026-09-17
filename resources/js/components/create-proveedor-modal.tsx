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
import { Separator } from '@/components/ui/separator';
import { store } from '@/routes/proveedores';
import type {
    CategoriaProveedor,
    TipoCuentaProveedor,
    TipoProveedor,
} from '@/types';

type Props = PropsWithChildren<{
    teamSlug: string;
}>;

export default function CreateProveedorModal({ teamSlug, children }: Props) {
    const [open, setOpen] = useState(false);
    const [tipoProveedor, setTipoProveedor] =
        useState<TipoProveedor>('REMISIONADO');
    const [categoriaProveedor, setCategoriaProveedor] =
        useState<CategoriaProveedor>('NO_DECLARANTE');
    const [tipoCuenta, setTipoCuenta] =
        useState<TipoCuentaProveedor>('AHORRO');
    const [flete, setFlete] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            setTipoProveedor('REMISIONADO');
            setCategoriaProveedor('NO_DECLARANTE');
            setTipoCuenta('AHORRO');
            setFlete(false);
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
            <DialogContent className="sm:max-w-3xl">
                <Form
                    key={String(open)}
                    {...store.form(teamSlug)}
                    className="space-y-6"
                    onSuccess={() => handleOpenChange(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Nuevo proveedor</DialogTitle>
                                <DialogDescription>
                                    Crea un nuevo proveedor con su
                                    información fiscal y bancaria.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="nombre_proveedor">
                                            Nombre
                                        </Label>
                                        <Input
                                            id="nombre_proveedor"
                                            name="nombre_proveedor"
                                            data-test="create-proveedor-nombre"
                                            required
                                        />
                                        <InputError
                                            message={errors.nombre_proveedor}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="razon_social_proveedor">
                                            Razón social
                                        </Label>
                                        <Input
                                            id="razon_social_proveedor"
                                            name="razon_social_proveedor"
                                        />
                                        <InputError
                                            message={
                                                errors.razon_social_proveedor
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="nit_proveedor">
                                            NIT
                                        </Label>
                                        <Input
                                            id="nit_proveedor"
                                            name="nit_proveedor"
                                            data-test="create-proveedor-nit"
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
                                        <InputError
                                            message={errors.tipo_proveedor}
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
                                        <InputError
                                            message={
                                                errors.categoria_proveedor
                                            }
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
                                            <Label htmlFor="departamento_proveedor">
                                                Departamento
                                            </Label>
                                            <Input
                                                id="departamento_proveedor"
                                                name="departamento_proveedor"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="ciudad_proveedor">
                                                Ciudad
                                            </Label>
                                            <Input
                                                id="ciudad_proveedor"
                                                name="ciudad_proveedor"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="direccion_proveedor">
                                                Dirección
                                            </Label>
                                            <Input
                                                id="direccion_proveedor"
                                                name="direccion_proveedor"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="telefono_proveedor">
                                                Teléfono
                                            </Label>
                                            <Input
                                                id="telefono_proveedor"
                                                name="telefono_proveedor"
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
                                            <Label htmlFor="banco_proveedor">
                                                Banco
                                            </Label>
                                            <Input
                                                id="banco_proveedor"
                                                name="banco_proveedor"
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
                                            <Label htmlFor="numero_cuenta_proveedor">
                                                Número de cuenta
                                            </Label>
                                            <Input
                                                id="numero_cuenta_proveedor"
                                                name="numero_cuenta_proveedor"
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
                                            <Label htmlFor="convenio">
                                                Convenio
                                            </Label>
                                            <Input
                                                id="convenio"
                                                name="convenio"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="tiempo_respuesta">
                                                Tiempo de respuesta
                                            </Label>
                                            <Input
                                                id="tiempo_respuesta"
                                                name="tiempo_respuesta"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="fabricante">
                                                Fabricante
                                            </Label>
                                            <Input
                                                id="fabricante"
                                                name="fabricante"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="valor_flete">
                                                Valor del flete
                                            </Label>
                                            <Input
                                                id="valor_flete"
                                                name="valor_flete"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                defaultValue="0"
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
                                    onChange={handleImageChange}
                                    error={errors.rut_proveedor_imagen}
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    name="rut_proveedor_imagen"
                                    className="hidden"
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
                                    data-test="create-proveedor-submit"
                                    disabled={processing}
                                >
                                    Crear proveedor
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
