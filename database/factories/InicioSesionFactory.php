<?php

namespace Database\Factories;

use App\Models\InicioSesion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InicioSesion>
 */
class InicioSesionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory();

        return [
            'user_id' => $user,
            'nombre' => fake()->name(),
            'email' => fake()->safeEmail(),
            'ip' => fake()->ipv4(),
            'navegador' => 'Chrome',
            'sistema_operativo' => 'Windows',
            'dispositivo' => 'Escritorio',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36',
            'created_at' => now(),
        ];
    }
}
