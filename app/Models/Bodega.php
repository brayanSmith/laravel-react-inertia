<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bodega extends Model
{
    use HasFactory;
    //
    protected $fillable = ['nombre_bodega', 'ubicacion_bodega'];

    public function productos()
    {
        return $this->hasMany(Producto::class);
    }
    public function pedidos()
    {
        return $this->hasMany(Pedido::class);
    }
    public function traslados()
    {
        return $this->hasMany(Traslado::class);
    }
    public function compras()
    {
        return $this->hasMany(Compra::class);
    }
    public function stockBodegas()
    {
        return $this->hasMany(StockBodega::class);
    }
    public function stockIniciales()
    {
        return $this->hasMany(StockInicial::class);
    }
    public function users()
    {
        return $this->hasMany(User::class);
    }

}
