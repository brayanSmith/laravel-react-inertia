<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('empresas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_empresa');
            $table->string('direccion_empresa')->nullable();
            $table->string('telefono_empresa')->nullable();
            $table->string('email_empresa')->nullable();
            $table->string('nit_empresa')->nullable();
            $table->string('logo_empresa')->nullable();
            //$table->json('cuentas_bancarias')->nullable();
            //$table->boolean('mostrar_productos_sin_inventario')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('empresas');
    }
};
