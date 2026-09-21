<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Contracts\PermissionsTeamResolver;

/**
 * The app has no teams: every role lives in one fixed "team" that only exists
 * because the permission tables keep a team column.
 */
class FixedTeamResolver implements PermissionsTeamResolver
{
    public const ID = 1;

    public function getPermissionsTeamId(): int|string|null
    {
        return self::ID;
    }

    public function setPermissionsTeamId(int|string|Model|null $id): void
    {
        // Always the same team.
    }
}
