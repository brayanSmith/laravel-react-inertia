<?php

use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Whoever could manage the roles can also see the history of changes; the
     * rest is decided from the roles page.
     */
    public function up(): void
    {
        $permiso = Permission::findOrCreate('historial.view', 'web');

        Role::query()
            ->whereHas('permissions', fn ($query) => $query->where('name', 'roles.view'))
            ->get()
            ->each(fn (Role $role) => $role->givePermissionTo($permiso));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::where('name', 'historial.view')->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
