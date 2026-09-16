<?php

namespace Database\Factories;

use App\Models\Cliente;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cliente>
 */
class ClienteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->firstName(),
            'apellido' => fake()->lastName(),
            'n_documento' => fake()->unique()->numerify('########'),
            'direccion' => fake()->streetAddress(),
            'email' => fake()->unique()->safeEmail(),
            'telefono' => fake()->phoneNumber(),
        ];
    }
}
