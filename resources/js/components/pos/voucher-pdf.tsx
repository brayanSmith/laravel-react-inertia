import {
    Document,
    Image,
    Page,
    StyleSheet,
    Text,
    View,
    pdf,
} from '@react-pdf/renderer';
import type { PosVoucher } from '@/types';

// Loaded on demand (dynamic import) from the "imprimir" button: this module
// pulls in the whole PDF renderer, which is far too heavy for the POS bundle.

/** 80 mm thermal-ticket width, in PDF points. */
const PAGE_WIDTH = 226.77;

/** Company-specific footer of the ticket. */
const PIE_VOUCHER = [
    'Las llantas tienen 3 años de garantía por desperfectos de fábrica.',
    'NO cubre daños ocasionados por mal uso. NO aplica Huevos en los costados',
    '¡GRACIAS POR SU COMPRA!',
];

const styles = StyleSheet.create({
    page: {
        padding: 10,
        fontFamily: 'Helvetica',
        fontSize: 8,
        color: '#000',
    },
    center: { textAlign: 'center' },
    bold: { fontFamily: 'Helvetica-Bold' },
    logo: { width: 90, alignSelf: 'center', marginBottom: 4 },
    empresa: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 2,
    },
    turno: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 2,
        borderBottomWidth: 1.5,
        borderBottomColor: '#000',
        alignSelf: 'center',
        paddingBottom: 1,
        marginVertical: 6,
    },
    separator: {
        borderBottomWidth: 0.7,
        borderBottomColor: '#000',
        borderBottomStyle: 'dashed',
        marginVertical: 5,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    itemHeader: {
        flexDirection: 'row',
        fontFamily: 'Helvetica-Bold',
        borderBottomWidth: 0.7,
        borderBottomColor: '#000',
        paddingBottom: 2,
        marginBottom: 3,
    },
    itemRow: { flexDirection: 'row', marginBottom: 4 },
    colItem: { flex: 1, paddingRight: 4 },
    colCantidad: { width: 48 },
    colTotal: { width: 52, textAlign: 'right' },
    total: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontFamily: 'Helvetica-Bold',
        fontSize: 11,
        marginVertical: 3,
    },
    pie: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 7.5,
        textAlign: 'center',
        marginBottom: 3,
    },
});

const money = (value: number): string =>
    `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

function Linea({ label, value }: { label: string; value: string | null }) {
    return (
        <Text style={styles.bold}>
            {label}: {value || 'N/A'}
        </Text>
    );
}

function Totales({
    label,
    value,
    bold = false,
}: {
    label: string;
    value: string;
    bold?: boolean;
}) {
    return (
        <View style={styles.row}>
            <Text style={bold ? styles.bold : undefined}>{label}</Text>
            <Text style={bold ? styles.bold : undefined}>{value}</Text>
        </View>
    );
}

/** Rough page height: the ticket is one continuous page sized to its content. */
function alturaPagina(voucher: PosVoucher): number {
    const extra =
        Math.ceil((voucher.pedido.observacion?.length ?? 0) / 38) +
        Math.ceil((voucher.pedido.observacion_pago?.length ?? 0) / 38);

    return 440 + voucher.detalles.length * 38 + extra * 10;
}

function VoucherDocument({
    voucher,
    logo,
}: {
    voucher: PosVoucher;
    logo: string | null;
}) {
    const { empresa, pedido, cliente, vendedor, detalles } = voucher;

    return (
        <Document title={`Voucher ${pedido.turno ?? pedido.id}`}>
            <Page
                size={{ width: PAGE_WIDTH, height: alturaPagina(voucher) }}
                style={styles.page}
            >
                {logo ? <Image src={logo} style={styles.logo} /> : null}
                <Text style={styles.empresa}>
                    {(empresa.nombre ?? '').toUpperCase()}
                </Text>
                {empresa.direccion ? (
                    <Text style={[styles.center, styles.bold]}>
                        {empresa.direccion}
                    </Text>
                ) : null}
                {empresa.telefono ? (
                    <Text style={[styles.center, styles.bold]}>
                        Tel: {empresa.telefono}
                    </Text>
                ) : null}
                {empresa.nit ? (
                    <Text style={[styles.center, styles.bold]}>
                        NIT: {empresa.nit}
                    </Text>
                ) : null}

                {pedido.turno ? (
                    <Text style={styles.turno}>{pedido.turno}</Text>
                ) : null}

                <View style={styles.separator} />
                <Text style={[styles.bold, { fontSize: 9 }]}>
                    REMISION N°: {pedido.id}
                </Text>
                <View style={styles.separator} />

                <Text style={[styles.center]}>Fecha: {pedido.fecha}</Text>
                <Text style={[styles.center, styles.bold]}>
                    Vendedor: {vendedor}
                </Text>
                <View style={styles.separator} />

                <Linea label="CLIENTE" value={cliente.razon_social} />
                <Linea label="NIT" value={cliente.numero_documento} />
                <Linea label="CIUDAD" value={cliente.ciudad} />
                <Linea label="DIR" value={cliente.direccion} />
                <Linea label="TEL" value={cliente.telefono} />
                <Linea label="PLACA" value={pedido.placa} />
                <Linea label="EMAIL" value={cliente.email} />
                <Linea
                    label="FACTURACION ELECTRONICA"
                    value={pedido.facturacion_electronica ? 'SI' : 'NO'}
                />
                <Text style={styles.bold}>
                    OBSERVACION: {pedido.observacion ?? ''}
                </Text>
                <Text style={styles.bold}>
                    OBSERVACION PAGO: {pedido.observacion_pago ?? ''}
                </Text>
                <View style={styles.separator} />

                <Text style={[styles.bold, { marginBottom: 3 }]}>
                    PRODUCTOS FACTURADOS
                </Text>
                <View style={styles.itemHeader}>
                    <Text style={styles.colItem}>ITEM</Text>
                    <Text style={styles.colCantidad}>CANTIDAD</Text>
                    <Text style={styles.colTotal}>TOTAL</Text>
                </View>
                {detalles.map((detalle, index) => (
                    <View key={index} style={styles.itemRow} wrap={false}>
                        <Text style={[styles.colItem, styles.bold]}>
                            {detalle.nombre}
                        </Text>
                        <Text style={[styles.colCantidad, styles.bold]}>
                            {detalle.cantidad}
                        </Text>
                        <Text style={[styles.colTotal, styles.bold]}>
                            {money(detalle.total).replace('.00', '')}
                        </Text>
                    </View>
                ))}
                <View style={styles.separator} />

                <Totales label="Subtotal" value={money(pedido.subtotal)} />
                <Totales
                    label="Descuento"
                    value={`- ${money(pedido.descuento)}`}
                />
                <Totales label="Flete" value={money(pedido.flete)} />
                <Totales label="Retefuente" value={money(pedido.retefuente)} />
                <Totales label="ReteIca" value={money(pedido.reteica)} />

                <View style={styles.total}>
                    <Text>TOTAL</Text>
                    <Text>{money(pedido.total_a_pagar)}</Text>
                </View>
                <Totales label="Abono" value={money(pedido.abono)} bold />
                <Totales
                    label="Debe"
                    value={`+${money(pedido.saldo_pendiente)}`}
                    bold
                />
                <View style={styles.separator} />

                {PIE_VOUCHER.map((linea) => (
                    <Text key={linea} style={styles.pie}>
                        {linea}
                    </Text>
                ))}
            </Page>
        </Document>
    );
}

/** The logo as a data URL (react-pdf can't fetch it cross-origin); null if
 * it can't be read, so a missing logo never blocks the voucher. */
async function cargarLogo(url: string | null): Promise<string | null> {
    if (!url) {
        return null;
    }

    try {
        // Keep just the path so it loads from this same origin even when
        // APP_URL differs from the address the POS is opened on.
        const response = await fetch(url.replace(/^https?:\/\/[^/]+/, ''));

        if (!response.ok) {
            return null;
        }

        const blob = await response.blob();

        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

export async function generarVoucherPdf(voucher: PosVoucher): Promise<Blob> {
    const logo = await cargarLogo(voucher.empresa.logo_url);

    return pdf(<VoucherDocument voucher={voucher} logo={logo} />).toBlob();
}
