import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import StockBodegasTable from '@/components/stock-bodegas-table';
import { index } from '@/routes/stock-bodegas';
import type { StockBodega } from '@/types';

type Props = {
    stockBodegas: StockBodega[];
};

export default function StockBodegasIndex({ stockBodegas }: Props) {
    return (
        <>
            <Head title="Stock por bodega" />

            <div className="flex flex-col space-y-6">
                <Heading
                    variant="small"
                    title="Stock por bodega"
                    description="Consulta el stock actual de los productos por bodega"
                />

                <StockBodegasTable stockBodegas={stockBodegas} />
            </div>
        </>
    );
}

StockBodegasIndex.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Stock por bodega',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
