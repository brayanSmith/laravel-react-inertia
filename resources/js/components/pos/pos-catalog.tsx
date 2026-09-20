import { Plus, RefreshCw, Search } from 'lucide-react';
import type { Ref } from 'react';
import { useEffect, useMemo, useState } from 'react';
import CreateProductoModal from '@/components/create-producto-modal';
import Pagination from '@/components/pagination';
import PosProductCard from '@/components/pos/pos-product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    MarcaOption,
    PosCatalogoProducto,
    TipoPrecioPedido,
} from '@/types';

type Props = {
    productos: PosCatalogoProducto[];
    /** Quantity of each product already reserved by the cart (by producto id). */
    /** Stock left for a product in the selected bodega, net of the cart. */
    stockDisponibleDe: (producto: PosCatalogoProducto) => number;
    /** Units of each product (by id) already in the cart of the active venta. */
    reservedByProducto: Map<number, number>;
    tipoPrecio: TipoPrecioPedido;
    onAdd: (producto: PosCatalogoProducto) => void;
    teamSlug: string;
    /** Lets the screen focus the search box (F2). */
    searchRef?: Ref<HTMLInputElement>;
    /** Lets the screen open the new-product form (F4). */
    nuevoProductoRef?: Ref<HTMLButtonElement>;
    /** Reloads the catalog (stock) without leaving the page. */
    onRefresh: () => void;
    refreshing: boolean;
    marcas: MarcaOption[];
    /** Whether the user may register a new product from here. */
    canCreateProducto: boolean;
};

const PAGE_SIZE = 50;
const TODAS_CATEGORIAS = 'TODAS';

function productoSearchText(producto: PosCatalogoProducto): string {
    return [
        producto.concatenar_codigo_nombre,
        producto.referencia_producto,
        producto.sku,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

export default function PosCatalog({
    productos,
    stockDisponibleDe,
    reservedByProducto,
    tipoPrecio,
    onAdd,
    teamSlug,
    marcas,
    canCreateProducto,
    searchRef,
    nuevoProductoRef,
    onRefresh,
    refreshing,
}: Props) {
    const [search, setSearch] = useState('');
    const [categoria, setCategoria] = useState(TODAS_CATEGORIAS);
    const [page, setPage] = useState(1);

    const categorias = useMemo(
        () =>
            Array.from(
                new Set(
                    productos
                        .map((producto) => producto.categoria)
                        .filter((value): value is string => Boolean(value)),
                ),
            ).sort(),
        [productos],
    );

    const filtrados = useMemo(() => {
        const term = search.trim().toLowerCase();

        return productos.filter((producto) => {
            if (
                categoria !== TODAS_CATEGORIAS &&
                producto.categoria !== categoria
            ) {
                return false;
            }

            return !term || productoSearchText(producto).includes(term);
        });
    }, [productos, search, categoria]);

    useEffect(() => {
        setPage(1);
    }, [search, categoria]);

    const totalPages = Math.max(Math.ceil(filtrados.length / PAGE_SIZE), 1);
    const currentPage = Math.min(page, totalPages);
    const pageItems = filtrados.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        ref={searchRef}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por nombre o SKU... (F2)"
                        className="pl-9"
                        data-test="pos-catalog-search"
                    />
                </div>

                {canCreateProducto ? (
                    <CreateProductoModal
                        teamSlug={teamSlug}
                        marcas={marcas}
                        stayOnPage
                    >
                        <Button
                            ref={nuevoProductoRef}
                            type="button"
                            variant="outline"
                            data-test="pos-nuevo-producto"
                        >
                            <Plus /> Nuevo producto
                            <kbd className="text-muted-foreground text-xs">
                                F4
                            </kbd>
                        </Button>
                    </CreateProductoModal>
                ) : null}

                <Button
                    type="button"
                    variant="outline"
                    disabled={refreshing}
                    onClick={onRefresh}
                    data-test="pos-actualizar-inventario"
                >
                    <RefreshCw className={refreshing ? 'animate-spin' : ''} />
                    Actualizar inventario
                    <kbd className="text-muted-foreground text-xs">F7</kbd>
                </Button>

                <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger
                        className="w-48"
                        data-test="pos-catalog-categoria"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={TODAS_CATEGORIAS}>
                            Todas las categorías
                        </SelectItem>
                        {categorias.map((value) => (
                            <SelectItem key={value} value={value}>
                                {value}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {pageItems.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] items-stretch gap-3">
                    {pageItems.map((producto) => (
                        <PosProductCard
                            key={producto.id}
                            producto={producto}
                            stockDisponible={stockDisponibleDe(producto)}
                            enCarrito={reservedByProducto.get(producto.id) ?? 0}
                            tipoPrecio={tipoPrecio}
                            onAdd={onAdd}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground py-8 text-center text-sm">
                    No se encontraron productos.
                </p>
            )}

            {filtrados.length > 0 ? (
                <div className="flex flex-col items-center gap-2 text-sm">
                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        dataTest="pos-catalog-page"
                    />
                    <span className="text-muted-foreground">
                        {filtrados.length} productos
                    </span>
                </div>
            ) : null}
        </div>
    );
}
