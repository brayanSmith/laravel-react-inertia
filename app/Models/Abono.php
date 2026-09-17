<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Abono extends Model
{
    //
    use HasFactory;
    protected $fillable = [
        'fecha',
        'monto',
        'con_cuanto_pago',
        'cambio',
        'descripcion',
        'imagen',
        'pedido_id',
        'puc_id',
        'user_id',
        'vendedor_id',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'monto' => 'decimal:2',
        'con_cuanto_pago' => 'decimal:2',
        'cambio' => 'decimal:2',
    ];

    public function calcularFechaVencimiento($dias = 30)
    {
        if ($this->fecha) {
            return $this->fecha->addDays($dias);
        }
        return null;
    }

    public function pedido()
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }

    public function puc()
    {
        return $this->belongsTo(Puc::class, 'puc_id');
    }

    public function formaPago()
    {
        return $this->belongsTo(Puc::class, 'puc_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function vendedor()
    {
        return $this->belongsTo(User::class, 'vendedor_id');
    }
}
