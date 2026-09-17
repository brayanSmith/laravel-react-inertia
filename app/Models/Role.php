<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    /**
     * Bodegas a las que este rol tiene acceso. Un rol sin bodegas asociadas
     * se interpreta como "sin restricción" (ve todas las bodegas).
     */
    public function bodegas(): BelongsToMany
    {
        return $this->belongsToMany(Bodega::class, 'bodega_role');
    }
}
