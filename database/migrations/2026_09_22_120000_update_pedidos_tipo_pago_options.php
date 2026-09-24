<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * "tipo_pago" drops CONTRA_ENTREGA (existing orders fold into CONTADO,
     * the closest of the remaining options) and renames APARTADO to SEPARADO.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // SQLite has no ALTER COLUMN for a CHECK constraint: the
            // constraint text is rewritten directly in the table's schema,
            // then the schema version is bumped so this same connection
            // reparses it (no reconnect, which would wipe an in-memory
            // testing database).
            DB::statement('PRAGMA writable_schema = 1');
            DB::statement(
                "UPDATE sqlite_master SET sql = REPLACE(sql, ?, ?) WHERE type = 'table' AND name = 'pedidos'",
                ["'CONTADO', 'APARTADO', 'CONTRA_ENTREGA', 'CREDITO'", "'CONTADO', 'SEPARADO', 'CREDITO'"],
            );
            DB::statement('PRAGMA writable_schema = 0');
            $version = (int) DB::selectOne('PRAGMA schema_version')->schema_version;
            DB::statement('PRAGMA schema_version = '.($version + 1));
        } else {
            // Widen first so both the old and new values are valid while the
            // data below is migrated, then narrow to the final set.
            DB::statement("ALTER TABLE pedidos MODIFY tipo_pago ENUM('CONTADO', 'APARTADO', 'CONTRA_ENTREGA', 'SEPARADO', 'CREDITO') NOT NULL DEFAULT 'CONTADO'");
        }

        DB::table('pedidos')->where('tipo_pago', 'APARTADO')->update(['tipo_pago' => 'SEPARADO']);
        DB::table('pedidos')->where('tipo_pago', 'CONTRA_ENTREGA')->update(['tipo_pago' => 'CONTADO']);

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE pedidos MODIFY tipo_pago ENUM('CONTADO', 'SEPARADO', 'CREDITO') NOT NULL DEFAULT 'CONTADO'");
        }
    }

    /**
     * Not reversible: which CONTRA_ENTREGA orders to restore cannot be told
     * apart from the CONTADO orders they were folded into.
     */
    public function down(): void
    {
        //
    }
};
