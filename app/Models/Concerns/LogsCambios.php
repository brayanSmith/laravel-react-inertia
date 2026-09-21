<?php

namespace App\Models\Concerns;

use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Writes the creation, edition and deletion of a simple record (one without
 * lines) to the history. The model only says which fields matter and what to
 * call itself: `logCampos()` and `logEtiqueta()`.
 */
trait LogsCambios
{
    use LogsActivity;

    /**
     * @return list<string>
     */
    abstract protected function logCampos(): array;

    /**
     * The record's name in the history and whether it is feminine in Spanish
     * ("Marca creada" vs "Gasto creado").
     *
     * @return array{0: string, 1: bool}
     */
    abstract protected function logEtiqueta(): array;

    public function getActivitylogOptions(): LogOptions
    {
        [$nombre, $femenino] = $this->logEtiqueta();
        $o = $femenino ? 'a' : 'o';

        return LogOptions::defaults()
            ->useLogName(str($nombre)->slug()->toString())
            ->logOnly($this->logCampos())
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $event): string => match ($event) {
                'created' => "{$nombre} ".($femenino ? 'creada' : 'creado'),
                'updated' => "{$nombre} ".($femenino ? 'editada' : 'editado'),
                'deleted' => "{$nombre} ".($femenino ? 'eliminada' : 'eliminado'),
                'restored' => "{$nombre} ".($femenino ? 'restaurada' : 'restaurado'),
                default => "{$nombre} {$event}",
            });
    }
}
