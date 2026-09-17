<?php

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;

test('expired invitations are deleted by the scheduled cleanup', function () {
    $this->travelTo(now()->startOfDay());

    $owner = User::factory()->create();
    $team = Team::factory()->create();

    attachTeamMember($team, $owner, 'Owner');

    $expiredInvitation = TeamInvitation::factory()->expired()->create([
        'team_id' => $team->id,
        'invited_by' => $owner->id,
    ]);

    $unexpiredInvitation = TeamInvitation::factory()->expiresIn(1)->create([
        'team_id' => $team->id,
        'invited_by' => $owner->id,
    ]);

    $invitationWithoutExpiration = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'invited_by' => $owner->id,
    ]);

    $this->artisan('schedule:run')->assertSuccessful();

    $this->assertDatabaseMissing('team_invitations', [
        'id' => $expiredInvitation->id,
    ]);

    $this->assertDatabaseHas('team_invitations', [
        'id' => $unexpiredInvitation->id,
    ]);

    $this->assertDatabaseHas('team_invitations', [
        'id' => $invitationWithoutExpiration->id,
    ]);
});
