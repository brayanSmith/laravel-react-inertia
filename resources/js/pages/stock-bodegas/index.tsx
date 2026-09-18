import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index } from '@/routes/stock-bodegas';
import type { StockBodega } from '@/types';

type Props = {
    stockBodegas: StockBodega[];
};

export default function StockBodegasIndex({ stockBodegas }: Props) {
    const productoLabel = (stockBodega: StockBodega) =>
        stockBodega.producto?.concatenar_codigo_nombre ??
        stockBodega.producto?.referencia_producto ??
        `Producto ${stockBodega.producto_id}`;

    return (
        <>
            <Head title="Stock por bodega" />

            <div className="flex flex-col space-y-6">
                <Heading
                    variant="small"
                    title="Stock por bodega"
                    description="Consulta el stock actual de los productos por bodega"
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Bodega</TableHead>
                            <TableHead className="text-right">
                                Stock inicial
                            </TableHead>
                            <TableHead className="text-right">
                                Entradas
                            </TableHead>
                            <TableHead className="text-right">
                                Salidas
                            </TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stockBodegas.map((stockBodega) => (
                            <TableRow
                                key={stockBodega.id}
                                data-test="stock-bodega-row"
                            >
                                <TableCell>
                                    {productoLabel(stockBodega)}
                                </TableCell>
                                <TableCell>
                                    {stockBodega.bodega?.nombre_bodega ?? '—'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {stockBodega.stock_inicial}
                                </TableCell>
                                <TableCell className="text-right">
                                    {stockBodega.entradas}
                                </TableCell>
                                <TableCell className="text-right">
                                    {stockBodega.salidas}
                                </TableCell>
                                <TableCell className="text-right">
                                    {stockBodega.stock}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {stockBodegas.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center">
                        No hay stock registrado.
                    </p>
                ) : null}
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
