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
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('tipo_documento');
            $table->string('numero_documento')->unique();
            $table->string('razon_social');
            $table->string('direccion')->nullable();
            $table->string('telefono')->nullable();
            $table->string('ciudad')->nullable();
            $table->string('email')->nullable()->unique();
            $table->boolean('activo')->default(true);
            $table->string('novedad')->nullable();
            $table->string('rut_imagen')->nullable();
            $table->enum('retenedor_fuente', ['SI', 'NO'])->default('NO');
            $table->timestamps();
            $table->softDeletes();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
