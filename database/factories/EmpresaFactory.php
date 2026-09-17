<?php

namespace Database\Factories;

use App\Models\Empresa;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Empresa>
 */
class EmpresaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre_empresa' => fake()->company(),
            'direccion_empresa' => fake()->streetAddress(),
            'telefono_empresa' => fake()->phoneNumber(),
            'email_empresa' => fake()->unique()->companyEmail(),
            'nit_empresa' => fake()->unique()->numerify('#########-#'),
            'logo_empresa' => null,
        ];
    }
}
