<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * The app has no teams any more. Every role, and who holds it, moves to
     * the single fixed permission "team" (id 1); roles that share a name
     * across teams are merged, and the team tables are dropped.
     */
    public function up(): void
    {
        $this->mergeRolesIntoOneTeam();
        $this->replaceTeamPermissionsWithRolePermissions();

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('current_team_id');
        });

        Schema::dropIfExists('team_invitations');
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('teams');

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        //
    }

    private function mergeRolesIntoOneTeam(): void
    {
        $team = 1;

        foreach (DB::table('roles')->orderBy('id')->get() as $role) {
            if ((int) $role->team_id === $team) {
                continue;
            }

            $target = DB::table('roles')
                ->where('team_id', $team)
                ->where('name', $role->name)
                ->where('guard_name', $role->guard_name)
                ->value('id');

            if ($target === null) {
                DB::table('roles')->where('id', $role->id)->update(['team_id' => $team]);

                continue;
            }

            foreach (DB::table('role_has_permissions')->where('role_id', $role->id)->pluck('permission_id') as $permissionId) {
                DB::table('role_has_permissions')->insertOrIgnore(['permission_id' => $permissionId, 'role_id' => $target]);
            }

            if (Schema::hasTable('bodega_role')) {
                foreach (DB::table('bodega_role')->where('role_id', $role->id)->pluck('bodega_id') as $bodegaId) {
                    DB::table('bodega_role')->insertOrIgnore(['bodega_id' => $bodegaId, 'role_id' => $target, 'created_at' => now(), 'updated_at' => now()]);
                }
            }

            foreach (DB::table('model_has_roles')->where('role_id', $role->id)->get() as $row) {
                DB::table('model_has_roles')->insertOrIgnore([
                    'role_id' => $target,
                    'model_type' => $row->model_type,
                    'model_id' => $row->model_id,
                    'team_id' => $team,
                ]);
            }

            DB::table('model_has_roles')->where('role_id', $role->id)->delete();
            DB::table('roles')->where('id', $role->id)->delete();
        }

        foreach (DB::table('model_has_roles')->where('team_id', '<>', $team)->get() as $row) {
            DB::table('model_has_roles')->insertOrIgnore([
                'role_id' => $row->role_id,
                'model_type' => $row->model_type,
                'model_id' => $row->model_id,
                'team_id' => $team,
            ]);
        }

        DB::table('model_has_roles')->where('team_id', '<>', $team)->delete();

        foreach (DB::table('model_has_permissions')->where('team_id', '<>', $team)->get() as $row) {
            DB::table('model_has_permissions')->insertOrIgnore([
                'permission_id' => $row->permission_id,
                'model_type' => $row->model_type,
                'model_id' => $row->model_id,
                'team_id' => $team,
            ]);
        }

        DB::table('model_has_permissions')->where('team_id', '<>', $team)->delete();
    }

    /**
     * Managing the roles used to depend on `team.update`; now it has its own
     * permissions, granted to whoever could manage the team.
     */
    private function replaceTeamPermissionsWithRolePermissions(): void
    {
        $teamUpdate = DB::table('permissions')->where('name', 'team.update')->value('id');
        $roleIds = $teamUpdate === null
            ? []
            : DB::table('role_has_permissions')->where('permission_id', $teamUpdate)->pluck('role_id')->all();

        foreach (['roles.view', 'roles.create', 'roles.update', 'roles.delete'] as $name) {
            $permissionId = DB::table('permissions')->where('name', $name)->value('id')
                ?? DB::table('permissions')->insertGetId([
                    'name' => $name,
                    'guard_name' => 'web',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            foreach ($roleIds as $roleId) {
                DB::table('role_has_permissions')->insertOrIgnore(['permission_id' => $permissionId, 'role_id' => $roleId]);
            }
        }

        DB::table('permissions')->where('name', 'like', 'team.%')->delete();
    }
};
