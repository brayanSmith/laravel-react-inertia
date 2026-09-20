import PosPage from '@/components/pos/pos-page';
import { index } from '@/routes/pos';
import type {
    BodegaOption,
    ClienteOption,
    MarcaOption,
    PosCatalogoProducto,
    PucOption,
    VendedorOption,
} from '@/types';

type Props = {
    clientes: ClienteOption[];
    productos: PosCatalogoProducto[];
    bodegas: BodegaOption[];
    vendedores: VendedorOption[];
    pucs: PucOption[];
    marcas: MarcaOption[];
    canCreateProducto: boolean;
    canCreateCliente: boolean;
};

export default function PosIndex(props: Props) {
    return <PosPage {...props} />;
}

PosIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'POS',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
    ],
});
