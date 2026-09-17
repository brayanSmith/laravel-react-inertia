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
        Schema::create('inicios_sesion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            // Nombre/correo se guardan aparte (no solo la FK): si el usuario
            // se borra o se le cambia el correo más adelante, el registro de
            // auditoría debe seguir mostrando quién entró en ese momento.
            $table->string('nombre');
            $table->string('email');
            $table->string('ip')->nullable();
            $table->string('navegador')->nullable();
            $table->string('sistema_operativo')->nullable();
            $table->string('dispositivo')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inicios_sesion');
    }
};
