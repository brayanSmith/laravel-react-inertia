<?php

namespace App\Models;

use App\Models\Concerns\LogsCambios;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bodega extends Model
{
    use HasFactory;
    use LogsCambios;

    //
    protected $fillable = ['nombre_bodega', 'ubicacion_bodega'];

    /**
     * Only the bodegas the authenticated user may use (see User::idsBodegasPermitidas()).
     *
     * @param  Builder<Bodega>  $query
     */
    public function scopePermitidas(Builder $query): void
    {
        $ids = auth()->user()?->idsBodegasPermitidas();

        if ($ids !== null) {
            $query->whereIn($query->qualifyColumn('id'), $ids);
        }
    }

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

    /**
     * @return list<string>
     */
    protected function logCampos(): array
    {
        return ['nombre_bodega', 'ubicacion_bodega'];
    }

    /**
     * @return array{0: string, 1: bool}
     */
    protected function logEtiqueta(): array
    {
        return ['Bodega', true];
    }
}
