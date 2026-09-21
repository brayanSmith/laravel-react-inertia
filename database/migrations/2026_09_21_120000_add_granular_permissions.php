<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * New, finer permissions: what each existing role could already do is
     * kept by granting the new permission to the roles that hold the
     * permission it was carved out of.
     *
     * @var array<string, list<string>> new permission => permissions it inherits from (any of them)
     */
    private function inheritance(): array
    {
        $map = [
            'pos.create-producto' => ['productos.create'],
            'pos.create-cliente' => ['clientes.create'],
            'pos.view-all-pedidos' => ['pos.view'],
            'stock-bodegas.view-inversion' => ['stock-bodegas.view'],
        ];

        foreach (['clientes', 'proveedores', 'productos', 'gastos', 'compras', 'pedidos', 'pedidos-mayoristas'] as $recurso) {
            $map["{$recurso}.view-deleted"] = ["{$recurso}.delete"];
            $map["{$recurso}.restore"] = ["{$recurso}.delete"];
        }

        foreach (['pedidos', 'pedidos-mayoristas'] as $modulo) {
            $map["{$modulo}.view-detalle"] = ["{$modulo}.view"];

            foreach (['create-abono', 'update-abono', 'delete-abono', 'create-detalle', 'update-detalle', 'delete-detalle', 'update-datos'] as $accion) {
                $map["{$modulo}.{$accion}"] = ["{$modulo}.update"];
            }
        }

        return $map;
    }

    public function up(): void
    {
        foreach ($this->inheritance() as $nueva => $origenes) {
            $permiso = Permission::findOrCreate($nueva, 'web');

            Role::query()
                ->whereHas('permissions', fn ($query) => $query->whereIn('name', $origenes))
                ->get()
                ->each(fn (Role $role) => $role->givePermissionTo($permiso));
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::whereIn('name', array_keys($this->inheritance()))->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
