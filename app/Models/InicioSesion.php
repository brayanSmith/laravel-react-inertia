<?php

namespace App\Models;

use Database\Factories\InicioSesionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InicioSesion extends Model
{
    /** @use HasFactory<InicioSesionFactory> */
    use HasFactory;

    protected $table = 'inicios_sesion';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'nombre',
        'email',
        'ip',
        'navegador',
        'sistema_operativo',
        'dispositivo',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
