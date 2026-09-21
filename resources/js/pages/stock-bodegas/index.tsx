import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import StockBodegasTable from '@/components/stock-bodegas-table';
import { index } from '@/routes/stock-bodegas';
import type { Bodega, StockBodega } from '@/types';

type Props = {
    stockBodegas: StockBodega[];
    productos: NonNullable<StockBodega['producto']>[];
    bodegas: Bodega[];
    canViewInversion: boolean;
};

export default function StockBodegasIndex({
    stockBodegas,
    productos,
    bodegas,
    canViewInversion,
}: Props) {
    return (
        <>
            <Head title="Stock por bodega" />

            <div className="flex flex-col space-y-6">
                <Heading
                    variant="small"
                    title="Stock por bodega"
                    description="Consulta el stock actual de los productos por bodega"
                />

                <StockBodegasTable
                    stockBodegas={stockBodegas}
                    productos={productos}
                    bodegas={bodegas}
                    canViewInversion={canViewInversion}
                />
            </div>
        </>
    );
}

StockBodegasIndex.layout = () => ({
    breadcrumbs: [
        {
            title: 'Stock por bodega',
            href: index(),
        },
    ],
});
