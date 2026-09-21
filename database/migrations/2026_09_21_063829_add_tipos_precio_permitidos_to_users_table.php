<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Which product prices (valor_detal, valor_mayorista, costo) the user may
     * see and use. Null means all of them, so existing users keep everything.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('tipos_precio_permitidos')->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('tipos_precio_permitidos');
        });
    }
};
