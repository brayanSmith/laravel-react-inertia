<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubCategoria extends Model
{
    //
    use HasFactory;

    protected $fillable = ['nombre_sub_categoria', 'categoria_id'];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }
    public function productos()
    {
        return $this->hasMany(Producto::class, 'sub_categoria_id');
    }

}
