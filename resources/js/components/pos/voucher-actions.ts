import type { PosVoucher } from '@/types';

/**
 * Renders the voucher PDF and saves it as a file. The PDF renderer is loaded
 * on demand, so it never weighs on the POS bundle.
 */
export async function descargarVoucher(voucher: PosVoucher): Promise<void> {
    const { generarVoucherPdf } = await import('@/components/pos/voucher-pdf');
    const url = URL.createObjectURL(await generarVoucherPdf(voucher));

    const link = document.createElement('a');
    link.href = url;
    link.download = `Voucher-${voucher.pedido.turno ?? voucher.pedido.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
