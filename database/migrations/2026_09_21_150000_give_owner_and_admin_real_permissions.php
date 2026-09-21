<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Historical data migration (Owner/Admin roles used to bypass the
     * permission checks). Those tiers were removed afterwards, so there is
     * nothing left to do here.
     */
    public function up(): void
    {
        //
    }

    public function down(): void
    {
        //
    }
};
