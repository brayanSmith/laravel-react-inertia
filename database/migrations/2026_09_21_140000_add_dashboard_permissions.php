<?php

use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /** @var list<string> */
    private array $permisos = [
        'dashboard.widget-productos',
        'dashboard.widget-ganancia',
        'dashboard.widget-ajustes',
        'dashboard.tabla-bodegas',
        'dashboard.chart-categorias',
        'dashboard.chart-top-productos',
        'dashboard.chart-pedidos',
    ];

    /**
     * Everybody saw the whole dashboard, so every existing role keeps
     * seeing it until an admin turns a widget off.
     */
    public function up(): void
    {
        $permisos = array_map(fn (string $nombre) => Permission::findOrCreate($nombre, 'web'), $this->permisos);

        Role::query()->get()->each(fn (Role $role) => $role->givePermissionTo($permisos));

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::whereIn('name', $this->permisos)->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
