<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('abono_compras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compra_id')->constrained('compras')->onDelete('cascade');
            $table->dateTime('fecha_abono_compra')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->decimal('monto_abono_compra', 12, 2)->default(0);
            $table->foreignId('forma_pago_abono_compra')->constrained('pucs')->onDelete('cascade');
            $table->string('descripcion_abono_compra')->nullable();
            $table->string('imagen_abono_compra')->nullable();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('abono_compras');
    }
};
