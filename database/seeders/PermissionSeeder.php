<?php

namespace Database\Seeders;

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
    }
}
