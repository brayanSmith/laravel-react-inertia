<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Pedido;
use App\Models\Producto;
use App\Services\Pedido\PedidoCalculoService;

class DetallePedido extends Model
{
    //
    use HasFactory;

    protected $table = 'detalle_pedidos';
    protected $fillable = [
        'pedido_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'costo_unitario',
        'costo_total',
        'ganancia_total',
        'subtotal'
    ];
    public function pedido()
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
    
    

}

