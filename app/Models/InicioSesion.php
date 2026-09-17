<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InicioSesion extends Model
{
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
