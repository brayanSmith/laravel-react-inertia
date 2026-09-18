<?php

namespace Database\Factories;

use App\Models\Bodega;
use App\Models\Producto;
use App\Models\StockBodega;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockBodega>
 */
class StockBodegaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $stockInicial = fake()->numberBetween(0, 200);
        $entradas = fake()->numberBetween(0, 500);
        $salidas = fake()->numberBetween(0, $entradas);

        return [
            'producto_id' => Producto::factory(),
            'bodega_id' => Bodega::factory(),
            'stock_inicial' => $stockInicial,
            'entradas' => $entradas,
            'salidas' => $salidas,
            'stock' => $stockInicial + $entradas - $salidas,
        ];
    }
}
