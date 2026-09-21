import { Head, Link, usePage } from '@inertiajs/react';
import { useTiposPrecio } from '@/hooks/use-tipos-precio';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { edit, index } from '@/routes/productos';
import type { Producto } from '@/types';

type Props = {
    producto: Producto;
};

function Field({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    return (
        <div className="grid gap-1">
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className="font-medium">{value ?? '—'}</span>
        </div>
    );
}

export default function ProductoShow({ producto }: Props) {
    const { puedeCosto, puedeDetal, puedeMayorista } = useTiposPrecio();
    const nombre = producto.concatenar_codigo_nombre || 'Producto';

    return (
        <>
            <Head title={nombre} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-muted-foreground text-sm">
                        <Link href={index()}>Productos</Link> {'>'} {nombre}
                    </div>
                    <h1 className="text-2xl font-bold">{nombre}</h1>
                </div>

                <Button asChild>
                    <Link href={edit([producto.id])}>
                        <Pencil /> Editar
                    </Link>
                </Button>
            </div>

            <div className="space-y-6">
                <div className="bg-card flex flex-wrap items-center gap-8 rounded-lg border p-4">
                    <Field label="Categoría" value={producto.categoria} />
                    <Field label="Tipo" value={producto.tipo} />
                    <Field
                        label="Inventariable"
                        value={producto.inventariable ? 'Sí' : 'No'}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="bg-card space-y-4 rounded-lg border p-4 lg:col-span-2">
                        <div className="font-semibold">Datos del Producto</div>
                        <div className="grid gap-4 sm:grid-cols-4">
                            <Field label="Ancho" value={producto.ancho} />
                            <Field label="Perfil" value={producto.perfil} />
                            <Field
                                label="Construcción"
                                value={producto.construccion}
                            />
                            <Field label="Rin" value={producto.rin} />
                            <Field
                                label="Tipo de Vehículo"
                                value={producto.tipo_vehiculo}
                            />
                            <Field label="Diámetro" value={producto.diametro} />
                            <Field
                                label="Referencia"
                                value={producto.referencia_producto}
                            />
                            <Field
                                label="Marca"
                                value={producto.marca?.marca}
                            />
                            <Field
                                label="Descripción"
                                value={producto.descripcion_producto}
                            />
                            <Field label="SKU" value={producto.sku} />
                        </div>
                    </div>

                    <div className="bg-card space-y-3 rounded-lg border p-4">
                        <div className="font-semibold">Imagen del Producto</div>
                        {producto.imagen_producto_url ? (
                            <img
                                src={producto.imagen_producto_url}
                                alt={nombre}
                                className="aspect-square w-full rounded-md border object-contain"
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Sin imagen
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-card space-y-4 rounded-lg border p-4">
                    <div className="font-semibold">Precios y Porcentajes</div>
                    <div className="grid gap-4 sm:grid-cols-4">
                        {puedeCosto ? (
                            <Field
                                label="Costo"
                                value={producto.costo_producto}
                            />
                        ) : null}
                        {puedeDetal ? (
                            <Field
                                label="Valor Detal"
                                value={producto.valor_detal}
                            />
                        ) : null}
                        {puedeMayorista ? (
                            <Field
                                label="Valor Mayorista"
                                value={producto.valor_mayorista}
                            />
                        ) : null}
                        <Field
                            label="Valor Sin Instalación"
                            value={producto.valor_sin_instalacion}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

ProductoShow.layout = () => ({
    breadcrumbs: [
        {
            title: 'Productos',
            href: index(),
        },
    ],
});
