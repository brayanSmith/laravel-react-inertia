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
        'clientes' => ['view', 'create', 'update', 'delete', 'view-deleted', 'restore'],
        'usuarios' => ['view', 'create', 'update', 'delete'],
        'bodegas' => ['view', 'create', 'update', 'delete'],
        'proveedores' => ['view', 'create', 'update', 'delete', 'view-deleted', 'restore'],
        'marcas' => ['view', 'create', 'update', 'delete'],
        'puc' => ['view', 'create', 'update', 'delete'],
        'empresa' => ['view', 'update'],
        'productos' => ['view', 'create', 'update', 'delete', 'view-deleted', 'restore'],
        'gastos' => ['view', 'create', 'update', 'delete', 'view-deleted', 'restore'],
        'compras' => ['view', 'create', 'update', 'delete', 'view-deleted', 'restore'],
        'pedidos' => ['view', 'create', 'update', 'delete', 'view-deleted', 'restore', 'view-detalle', 'create-abono', 'update-abono', 'delete-abono', 'create-detalle', 'update-detalle', 'delete-detalle', 'update-datos'],
        'pedidos-mayoristas' => ['view', 'create', 'update', 'delete', 'view-deleted', 'restore', 'view-detalle', 'create-abono', 'update-abono', 'delete-abono', 'create-detalle', 'update-detalle', 'delete-detalle', 'update-datos'],
        'stock-iniciales' => ['view', 'create', 'update', 'delete'],
        'stock-bodegas' => ['view', 'view-inversion'],
        'cotizador' => ['view'],
        'pos' => ['view', 'create', 'create-producto', 'create-cliente', 'view-all-pedidos'],
        'inicios-sesion' => ['view'],
        'roles' => ['view', 'create', 'update', 'delete'],
        'dashboard' => ['widget-productos', 'widget-ganancia', 'widget-ajustes', 'tabla-bodegas', 'chart-categorias', 'chart-top-productos', 'chart-pedidos'],
        'traslados' => ['view', 'create', 'update', 'delete'],
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
