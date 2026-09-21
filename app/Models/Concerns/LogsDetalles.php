<?php

namespace App\Models\Concerns;

/**
 * For the documents made of lines (pedidos, compras): their lines are
 * replaced as a whole on every edit, so instead of logging each line model the
 * document writes one "productos" entry to the history, and only when the
 * lines really changed. The model provides `resumenDetalles()` and the words
 * of the entry in `etiquetaDetalles()`.
 */
trait LogsDetalles
{
    /**
     * Writes a "detalles" entry to the history when the lines changed (or when
     * there were none before, i.e. on creation).
     *
     * @param  list<array<string, mixed>>|null  $antes  Lines before the edit, or null when the document is new.
     */
    public function registrarCambioDetalles(?array $antes, float $totalAntes = 0.0): void
    {
        $despues = $this->resumenDetalles();

        if ($antes === $despues) {
            return;
        }

        activity($this->getActivitylogOptions()->logName)
            ->performedOn($this)
            ->event('detalles')
            ->withProperties([
                'old' => $antes === null ? [] : ['productos' => $antes, 'total_a_pagar' => $totalAntes],
                'attributes' => ['productos' => $despues, 'total_a_pagar' => (float) $this->fresh()->total_a_pagar],
            ])
            ->log($antes === null ? $this->etiquetaDetalles() : $this->etiquetaDetalles().' modificados');
    }
}
