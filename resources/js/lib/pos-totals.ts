type Adjustments = {
    descuento: string;
    flete: string;
    reteica: string;
    retefuente: string;
};

/**
 * The amounts shown at checkout. `total` mirrors the backend's
 * `total_a_pagar` (subtotal + flete − descuento − reteica − retefuente,
 * never below zero) so what the cashier sees is what gets saved.
 */
export function calcularTotales(totalBruto: number, ajustes: Adjustments) {
    const descuento = Number(ajustes.descuento) || 0;
    const flete = Number(ajustes.flete) || 0;
    const reteica = Number(ajustes.reteica) || 0;
    const retefuente = Number(ajustes.retefuente) || 0;

    return {
        subtotal: Math.max(totalBruto - descuento, 0),
        total: Math.max(
            totalBruto + flete - descuento - reteica - retefuente,
            0,
        ),
    };
}
