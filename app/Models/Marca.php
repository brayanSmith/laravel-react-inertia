<?php

namespace App\Models;

use App\Models\Concerns\LogsCambios;
use Database\Factories\MarcaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Marca extends Model
{
    /** @use HasFactory<MarcaFactory> */
    use HasFactory;

    use LogsCambios;

    protected $fillable = [
        'marca',
        'descripcion_marca',
    ];

    public function productos()
    {
        return $this->hasMany(Producto::class);
    }

    /**
     * @return list<string>
     */
    protected function logCampos(): array
    {
        return ['marca', 'descripcion_marca'];
    }

    /**
     * @return array{0: string, 1: bool}
     */
    protected function logEtiqueta(): array
    {
        return ['Marca', true];
    }
}
