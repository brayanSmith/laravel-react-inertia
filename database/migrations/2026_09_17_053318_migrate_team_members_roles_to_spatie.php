<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Historical data migration (team member roles to Spatie roles). Teams
     * were removed afterwards, so there is nothing left to do here.
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
