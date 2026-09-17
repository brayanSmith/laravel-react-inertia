<?php

use App\Models\Team;
use App\Models\User;
use App\Support\TeamRoles;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Backfills the Owner/Admin/Member Spatie roles for every existing team, migrates
     * each team_members row's legacy `role` string into a Spatie role assignment, and
     * rewrites pending team_invitations.role values from enum values to role names.
     */
    public function up(): void
    {
        Team::query()->orderBy('id')->each(fn (Team $team) => TeamRoles::provisionDefaultRoles($team));

        DB::table('team_members')->orderBy('id')->get(['team_id', 'user_id', 'role'])
            ->each(function (object $membership): void {
                $tier = ucfirst($membership->role);

                if (! in_array($tier, TeamRoles::TIERS, true)) {
                    return;
                }

                $team = Team::find($membership->team_id);
                $user = User::find($membership->user_id);

                if (! $team || ! $user) {
                    return;
                }

                TeamRoles::assignTier($user, $team, $tier);
            });

        DB::table('team_invitations')->whereNull('accepted_at')->get(['id', 'role'])
            ->each(function (object $invitation): void {
                $tier = ucfirst($invitation->role);

                if (! in_array($tier, TeamRoles::TIERS, true)) {
                    return;
                }

                DB::table('team_invitations')->where('id', $invitation->id)->update(['role' => $tier]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Data migration; not reversible.
    }
};
