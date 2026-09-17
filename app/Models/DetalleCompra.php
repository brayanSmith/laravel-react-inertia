<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetalleCompra extends Model
{
    /** @use HasFactory<\Database\Factories\DetalleCompraFactory> */
    use HasFactory;
    protected $fillable = [
        'compra_id',
        'producto_id',
        'bodega_id',
        'estado_entrega',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    public function compra()
    {
        return $this->belongsTo(Compra::class, 'compra_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }
}
