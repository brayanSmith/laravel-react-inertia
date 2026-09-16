<?php

namespace Database\Factories;

use App\Models\Producto;
use App\Models\SubCategoria;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Producto>
 */
class ProductoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $costo = fake()->randomFloat(2, 5, 500);
        $subCategoria = SubCategoria::inRandomOrder()->first() ?? SubCategoria::factory()->create();

        return [
            'categoria_id' => $subCategoria->categoria_id,
            'sub_categoria_id' => $subCategoria->id,
            'codigo' => fake()->unique()->bothify('PRD-#####'),
            'nombre' => fake()->words(3, true),
            'descripcion' => fake()->optional()->sentence(),
            'costo' => $costo,
            'precio_mayorista' => round($costo * 1.2, 2),
            'precio_detal' => round($costo * 1.5, 2),
            'precio_especial' => round($costo * 1.35, 2),
            'imagen' => null,
        ];
    }
}
