<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\SoftDeletes;

class Compra extends Model
{
    /** @use HasFactory<\Database\Factories\CompraFactory> */
    use HasFactory;
    use SoftDeletes;
    protected $fillable = [
        'factura',
        'proveedor_id',
        'fecha',
        'estado',
        'observaciones',
        'subtotal',
        'descuento',
        'total_a_pagar',
    ];

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }
    public function detallesCompra()
    {
        return $this->hasMany(DetalleCompra::class);
    }

    protected function titulo(): Attribute
    {
        return Attribute::make(
            get: fn() => "{$this->id} - {$this->factura}",
        );
    }
}
