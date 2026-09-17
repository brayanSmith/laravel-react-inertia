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
        Schema::create('proveedors', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_proveedor');
            $table->string('razon_social_proveedor')->nullable();
            $table->string('nit_proveedor')->unique();
            $table->string('rut_proveedor_imagen')->nullable();
            $table->enum('tipo_proveedor', ['REMISIONADO', 'ELECTRONICO'])->default('REMISIONADO');
            $table->enum('categoria_proveedor', ['DECLARANTE', 'NO_DECLARANTE', 'RETENEDOR'])->default('NO_DECLARANTE');
            $table->string('departamento_proveedor')->nullable();
            $table->string('ciudad_proveedor')->nullable();
            $table->string('direccion_proveedor')->nullable();
            $table->string('telefono_proveedor')->nullable();
            $table->string('banco_proveedor')->nullable();
            $table->enum('tipo_cuenta_proveedor',['AHORRO', 'CORRIENTE'])->nullable();
            $table->string('numero_cuenta_proveedor')->nullable();
            $table->string('convenio')->nullable();
            $table->string('tiempo_respuesta')->nullable();
            $table->string('fabricante')->nullable();
            $table->boolean('flete')->default(false);
            $table->decimal('valor_flete', 15, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proveedors');
    }
};
