<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Producto extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'categoria_id',
        'sub_categoria_id',
        'codigo',
        'nombre',
        'descripcion',
        'costo',
        'precio_detal',
        'precio_mayorista',
        'precio_especial',
        'imagen',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'costo' => 'float',
            'precio_detal' => 'float',
            'precio_mayorista' => 'float',
            'precio_especial' => 'float',
        ];
    }

    public function stockBodegas()
    {
        return $this->hasMany(StockBodega::class);
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function subCategoria()
    {
        return $this->belongsTo(SubCategoria::class, 'sub_categoria_id');
    }
}
