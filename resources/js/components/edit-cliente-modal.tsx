import { Form } from '@inertiajs/react';
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
import { update } from '@/routes/clientes';
import type { Cliente } from '@/types';

type Props = {
    currentTeamSlug: string;
    cliente: Cliente | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EditClienteModal({
    currentTeamSlug,
    cliente,
    open,
    onOpenChange,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {cliente ? (
                    <Form
                        key={cliente.id}
                        {...update.form([currentTeamSlug, cliente.id])}
                        className="space-y-6"
                        onSuccess={() => onOpenChange(false)}
                    >
                        {({ errors, processing }) => (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Editar cliente</DialogTitle>
                                    <DialogDescription>
                                        Actualiza la información de{' '}
                                        {cliente.nombre} {cliente.apellido}.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-nombre">
                                            Nombre
                                        </Label>
                                        <Input
                                            id="edit-nombre"
                                            name="nombre"
                                            data-test="edit-cliente-nombre"
                                            defaultValue={cliente.nombre}
                                            required
                                        />
                                        <InputError message={errors.nombre} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-apellido">
                                            Apellido
                                        </Label>
                                        <Input
                                            id="edit-apellido"
                                            name="apellido"
                                            data-test="edit-cliente-apellido"
                                            defaultValue={cliente.apellido}
                                            required
                                        />
                                        <InputError message={errors.apellido} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-n_documento">
                                        N.º de documento
                                    </Label>
                                    <Input
                                        id="edit-n_documento"
                                        name="n_documento"
                                        data-test="edit-cliente-n-documento"
                                        defaultValue={cliente.n_documento}
                                        required
                                    />
                                    <InputError message={errors.n_documento} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-email">
                                        Correo electrónico
                                    </Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        name="email"
                                        data-test="edit-cliente-email"
                                        defaultValue={cliente.email}
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-telefono">
                                        Teléfono
                                    </Label>
                                    <Input
                                        id="edit-telefono"
                                        name="telefono"
                                        data-test="edit-cliente-telefono"
                                        defaultValue={cliente.telefono ?? ''}
                                    />
                                    <InputError message={errors.telefono} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-direccion">
                                        Dirección
                                    </Label>
                                    <Input
                                        id="edit-direccion"
                                        name="direccion"
                                        data-test="edit-cliente-direccion"
                                        defaultValue={cliente.direccion ?? ''}
                                    />
                                    <InputError message={errors.direccion} />
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
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
