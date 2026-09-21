<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The tipo enum only allowed NUEVO/USADO; SERVICIO is now a third value.
     */
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->string('tipo', 20)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->enum('tipo', ['NUEVO', 'USADO'])->nullable()->change();
        });
    }
};
