<?php

namespace App\Models;

use App\Models\Concerns\LogsCambios;
use Database\Factories\PucFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Puc extends Model
{
    /** @use HasFactory<PucFactory> */
    use HasFactory;

    use LogsCambios;

    protected $fillable = [
        'tipo',
        'cuenta',
        'subcuenta',
        'concepto',
        'descripcion',
        'concatenar_subcuenta_concepto',
    ];

    public function pedidos()
    {
        return $this->hasMany(Pedido::class, 'id_puc');
    }

    public function abonos()
    {
        return $this->hasMany(Abono::class, 'puc_id');
    }

    /**
     * @return list<string>
     */
    protected function logCampos(): array
    {
        return ['tipo', 'cuenta', 'subcuenta', 'concepto', 'descripcion'];
    }

    /**
     * @return array{0: string, 1: bool}
     */
    protected function logEtiqueta(): array
    {
        return ['Puc', false];
    }
}
