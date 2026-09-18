<?php

namespace Database\Factories;

use App\Models\Bodega;
use App\Models\Producto;
use App\Models\StockInicial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockInicial>
 */
class StockInicialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'producto_id' => Producto::factory(),
            'bodega_id' => Bodega::factory(),
            'cantidad' => fake()->numberBetween(0, 500),
        ];
    }
}
