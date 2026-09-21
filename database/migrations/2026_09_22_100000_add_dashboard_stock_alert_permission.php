<?php

use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * The new "sin stock" alert of the dashboard is granted to every role, so
     * it shows up for everybody until someone turns it off.
     */
    public function up(): void
    {
        $permiso = Permission::findOrCreate('dashboard.alerta-stock', 'web');

        Role::query()->get()->each(fn (Role $role) => $role->givePermissionTo($permiso));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::where('name', 'dashboard.alerta-stock')->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
