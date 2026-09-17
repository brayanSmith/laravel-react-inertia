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
            'tipo_documento' => 'CC',
            'numero_documento' => fake()->unique()->numerify('##########'),
            'razon_social' => fake()->company(),
            'direccion' => fake()->streetAddress(),
            'telefono' => fake()->phoneNumber(),
            'ciudad' => fake()->city(),
            'email' => fake()->unique()->safeEmail(),
            'activo' => true,
            'novedad' => null,
            'rut_imagen' => null,
            'retenedor_fuente' => 'NO',
        ];
    }
}
