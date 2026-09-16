<?php

namespace Database\Factories;

use App\Models\Categoria;
use App\Models\SubCategoria;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SubCategoria>
 */
class SubCategoriaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'categoria_id' => Categoria::factory(),
            'nombre' => fake()->unique()->words(2, true),
            'descripcion' => fake()->optional()->sentence(),
        ];
    }
}
