<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Empresa extends Model
{
    //
    use HasFactory;
    protected $fillable = [
        'nombre_empresa',
        'direccion_empresa',
        'telefono_empresa',
        'email_empresa',
        'nit_empresa',
        'logo_empresa',      
    ];

  


}
