import { Form, Head, usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import ImageField from '@/components/image-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit, update } from '@/routes/empresa';
import type { Empresa, EmpresaPermissions } from '@/types';

type Props = {
    empresa: Empresa | null;
    permissions: EmpresaPermissions;
};

export default function EmpresaEdit({ empresa, permissions }: Props) {
    return (
        <>
            <Head title="Empresa" />

            <h1 className="sr-only">Perfil de la empresa</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Perfil de la empresa"
                    description="Esta información aparece en tus documentos y facturas"
                />

                <Form {...update.form()} className="space-y-6">
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre_empresa">
                                        Nombre
                                    </Label>
                                    <Input
                                        id="nombre_empresa"
                                        name="nombre_empresa"
                                        data-test="empresa-nombre"
                                        defaultValue={
                                            empresa?.nombre_empresa ?? ''
                                        }
                                        disabled={!permissions.canUpdate}
                                        required
                                    />
                                    <InputError
                                        message={errors.nombre_empresa}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="nit_empresa">NIT</Label>
                                    <Input
                                        id="nit_empresa"
                                        name="nit_empresa"
                                        data-test="empresa-nit"
                                        defaultValue={
                                            empresa?.nit_empresa ?? ''
                                        }
                                        disabled={!permissions.canUpdate}
                                    />
                                    <InputError message={errors.nit_empresa} />
                                </div>

                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="direccion_empresa">
                                        Dirección
                                    </Label>
                                    <Input
                                        id="direccion_empresa"
                                        name="direccion_empresa"
                                        defaultValue={
                                            empresa?.direccion_empresa ?? ''
                                        }
                                        disabled={!permissions.canUpdate}
                                    />
                                    <InputError
                                        message={errors.direccion_empresa}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="telefono_empresa">
                                        Teléfono
                                    </Label>
                                    <Input
                                        id="telefono_empresa"
                                        name="telefono_empresa"
                                        defaultValue={
                                            empresa?.telefono_empresa ?? ''
                                        }
                                        disabled={!permissions.canUpdate}
                                    />
                                    <InputError
                                        message={errors.telefono_empresa}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email_empresa">Email</Label>
                                    <Input
                                        id="email_empresa"
                                        name="email_empresa"
                                        type="email"
                                        defaultValue={
                                            empresa?.email_empresa ?? ''
                                        }
                                        disabled={!permissions.canUpdate}
                                    />
                                    <InputError
                                        message={errors.email_empresa}
                                    />
                                </div>
                            </div>

                            {permissions.canUpdate ? (
                                <ImageField
                                    name="logo_empresa"
                                    removeName="remove_logo_empresa"
                                    label="Logo de la empresa"
                                    value={empresa?.logo_empresa_url}
                                    error={errors.logo_empresa}
                                />
                            ) : null}

                            {permissions.canUpdate ? (
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="submit"
                                        data-test="empresa-save-button"
                                        disabled={processing}
                                    >
                                        Guardar
                                    </Button>
                                </div>
                            ) : null}
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

EmpresaEdit.layout = () => ({
    breadcrumbs: [
        {
            title: 'Empresa',
            href: edit(),
        },
    ],
});
