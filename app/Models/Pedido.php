<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Services\Pedido\PedidoCalculoService;
use App\Services\Pedido\PedidoStockService;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pedido extends Model
{
    //
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'codigo',
        'cliente_id',
        'fecha',
        'estado',
        'estado_pago',
        //'tipo_pedido',
        'tipo_pago',
        'tipo_precio',
        'id_puc',
        'bodega_id',
        'observacion',
        'observacion_pago',
        'subtotal',
        'descuento',
        'flete',
        'total_a_pagar',
        'abono',
        'saldo_pendiente',
        'user_id',
        'aplica_turno',
        'turno',
        'placa',
        'reteica',
        'retefuente',
        'facturacion_electronica',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'fecha_vencimiento' => 'datetime',
        'fecha_ultimo_abono' => 'datetime',
        'reteica' => 'decimal:2',
        'retefuente' => 'decimal:2',
        'facturacion_electronica' => 'boolean',
    ];
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
    public function detalles()
    {
        return $this->hasMany(DetallePedido::class);
    }
    public function abonoPedido()
    {
        return $this->hasMany(Abono::class);
    }

    // Alias para compatibilidad - obtener todos los abonos
    public function abonos()
    {
        return $this->hasMany(Abono::class);
    }
    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
    public function alistador()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function puc()
    {
        return $this->belongsTo(Puc::class, 'id_puc');
    }

    public function setCodigoPedido()
    {
        $nuevoCodigo = PedidoCalculoService::generarCodigoPedido($this->id);
            $this->updateQuietly(['codigo' => $nuevoCodigo]);
    }

    // Atributo: devolver fecha en America/Bogota
    public function getFechaAttribute($value)
    {
        if (is_null($value)) {
            return null;
        }
        return \Carbon\Carbon::parse($value)->setTimezone('America/Bogota');
    }
}
