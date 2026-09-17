<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Gasto extends Model
{
    /** @use HasFactory<\Database\Factories\GastoFactory> */
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [

        'bodega_id',
        'descripcion',
        'monto',
        'fecha_gasto',
    ];

    public function bodega()
    {
        return $this->belongsTo(Bodega::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
