<?php

use App\Models\Team;
use App\Models\User;
use App\Support\TeamRoles;

test('team member roles can be updated by owners', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $team = Team::factory()->create();

    attachTeamMember($team, $owner, 'Owner');
    attachTeamMember($team, $member, 'Member');

    $response = $this
        ->actingAs($owner)
        ->patch(route('teams.members.update', [$team, $member]), [
            'role' => 'admin',
        ]);

    $response->assertRedirect(route('teams.edit', $team));

    expect(TeamRoles::tierRole($member, $team)?->name)->toEqual('Admin');
});

test('team member roles cannot be updated by non owners', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $member = User::factory()->create();
    $team = Team::factory()->create();

    attachTeamMember($team, $owner, 'Owner');
    attachTeamMember($team, $admin, 'Admin');
    attachTeamMember($team, $member, 'Member');

    $response = $this
        ->actingAs($admin)
        ->patch(route('teams.members.update', [$team, $member]), [
            'role' => 'admin',
        ]);

    $response->assertForbidden();
});

test('team members can be removed by owners', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $team = Team::factory()->create();

    attachTeamMember($team, $owner, 'Owner');
    attachTeamMember($team, $member, 'Member');

    $response = $this
        ->actingAs($owner)
        ->delete(route('teams.members.destroy', [$team, $member]));

    $response->assertRedirect(route('teams.edit', $team));

    expect($member->fresh()->belongsToTeam($team))->toBeFalse();
});

test('team members cannot be removed by non owners', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $member = User::factory()->create();
    $team = Team::factory()->create();

    attachTeamMember($team, $owner, 'Owner');
    attachTeamMember($team, $admin, 'Admin');
    attachTeamMember($team, $member, 'Member');

    $response = $this
        ->actingAs($admin)
        ->delete(route('teams.members.destroy', [$team, $member]));

    $response->assertForbidden();
});

test('team owner cannot be removed', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();

    attachTeamMember($team, $owner, 'Owner');

    $response = $this
        ->actingAs($owner)
        ->delete(route('teams.members.destroy', [$team, $owner]));

    $response->assertForbidden();

    expect($owner->fresh()->belongsToTeam($team))->toBeTrue();
});

test('team member role cannot be set to owner', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $team = Team::factory()->create();

    attachTeamMember($team, $owner, 'Owner');
    attachTeamMember($team, $member, 'Member');

    $response = $this
        ->actingAs($owner)
        ->patch(route('teams.members.update', [$team, $member]), [
            'role' => 'owner',
        ]);

    $response->assertSessionHasErrors('role');

    expect(TeamRoles::tierRole($member, $team)?->name)->toEqual('Member');
});

test('removed member current team is set to personal team', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $personalTeam = $member->personalTeam();
    $team = Team::factory()->create();

    attachTeamMember($team, $owner, 'Owner');
    attachTeamMember($team, $member, 'Member');

    $member->update(['current_team_id' => $team->id]);

    $this
        ->actingAs($owner)
        ->delete(route('teams.members.destroy', [$team, $member]));

    expect($member->fresh()->current_team_id)->toEqual($personalTeam->id);
});
