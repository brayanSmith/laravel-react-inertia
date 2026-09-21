import { Head } from '@inertiajs/react';
import CotizadorForm from '@/components/cotizador-form';
import Heading from '@/components/heading';
import { index } from '@/routes/cotizador';
import type { CotizadorProducto, TipoPrecioCotizador } from '@/types';

type Props = {
    productos: CotizadorProducto[];
    tipoPrecioRestringido: TipoPrecioCotizador | null;
};

export default function CotizadorIndex({
    productos,
    tipoPrecioRestringido,
}: Props) {
    return (
        <>
            <Head title="Cotizador" />

            <div className="flex flex-col space-y-6">
                <Heading
                    variant="small"
                    title="Cotizador"
                    description="Genera cotizaciones rápidas por referencia de producto"
                />

                <CotizadorForm
                    productos={productos}
                    tipoPrecioRestringido={tipoPrecioRestringido}
                />
            </div>
        </>
    );
}

CotizadorIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Cotizador',
            href: index(),
        },
    ],
});
