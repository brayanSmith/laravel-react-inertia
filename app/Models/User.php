<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Concerns\LogsCambios;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $avatar Public URL of the profile picture (the stored path is in the raw attribute).
 * @property string|null $remember_token
 * @property list<string>|null $tipos_precio_permitidos
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'tipos_precio_permitidos'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, LogsCambios, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * The profile picture as a public URL; the raw attribute is the stored path.
     *
     * @return Attribute<string|null, never>
     */
    protected function avatar(): Attribute
    {
        return Attribute::make(
            get: fn (?string $path) => $path ? Storage::disk('public')->url($path) : null,
        );
    }

    /**
     * Replaces the user's roles and writes the change to the history.
     *
     * @param  iterable<Role>  $roles
     */
    public function syncRolesWithHistory(iterable $roles): void
    {
        $antes = $this->roles()->pluck('name')->sort()->values()->all();

        $this->syncRoles($roles);
        $this->unsetRelation('roles');

        $despues = $this->roles()->pluck('name')->sort()->values()->all();

        if ($antes === $despues) {
            return;
        }

        activity('usuarios')
            ->performedOn($this)
            ->event('roles')
            ->withProperties(['old' => ['roles' => $antes], 'attributes' => ['roles' => $despues]])
            ->log('Roles del usuario modificados');
    }

    /**
     * @return list<string>
     */
    protected function logCampos(): array
    {
        return ['name', 'email', 'tipos_precio_permitidos'];
    }

    /**
     * @return array{0: string, 1: bool}
     */
    protected function logEtiqueta(): array
    {
        return ['Usuario', false];
    }

    /** The product prices a user can be allowed to see and use. */
    public const TIPOS_PRECIO = ['valor_detal', 'valor_mayorista', 'costo'];

    /**
     * The prices this user may see and use; all of them until restricted.
     *
     * @return list<string>
     */
    public function tiposPrecioPermitidos(): array
    {
        return $this->tipos_precio_permitidos ?? self::TIPOS_PRECIO;
    }

    public function puedeVerPrecio(string $tipo): bool
    {
        return in_array($tipo, $this->tiposPrecioPermitidos(), true);
    }

    /**
     * Ids of the bodegas this user may use in the current team, or null when
     * there is no restriction: the union of the bodegas selected on their
     * roles, and roles without any bodega selected do not restrict.
     *
     * @return list<int>|null
     */
    public function idsBodegasPermitidas(): ?array
    {
        $ids = $this->roles
            ->load('bodegas')
            ->flatMap(fn (Role $role) => $role->bodegas->pluck('id'))
            ->unique()
            ->values();

        return $ids->isEmpty() ? null : $ids->all();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'tipos_precio_permitidos' => 'array',
        ];
    }
}
