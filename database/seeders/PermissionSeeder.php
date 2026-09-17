<?php

namespace Database\Seeders;

use App\Support\TeamRoles;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Catalog of business-module permissions, as resource => [actions].
     * Add an entry here whenever a new module/CRUD is built, then re-run this seeder.
     *
     * @var array<string, array<string>>
     */
    protected array $catalog = [
        'clientes' => ['view', 'create', 'update', 'delete'],
        'usuarios' => ['view', 'create', 'update', 'delete'],
        'bodegas' => ['view', 'create', 'update', 'delete'],
        'proveedores' => ['view', 'create', 'update', 'delete'],
        'marcas' => ['view', 'create', 'update', 'delete'],
        'puc' => ['view', 'create', 'update', 'delete'],
        'empresa' => ['view', 'update'],
    ];

    /**
     * Seed the application's permissions.
     */
    public function run(): void
    {
        foreach ($this->catalog as $resource => $actions) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$resource}.{$action}"]);
            }
        }

        foreach (TeamRoles::TEAM_PERMISSIONS as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }
}
