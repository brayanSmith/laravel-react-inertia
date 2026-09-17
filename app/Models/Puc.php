<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Puc extends Model
{
    /** @use HasFactory<\Database\Factories\PucFactory> */
    use HasFactory;
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
}
