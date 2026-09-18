<?php

namespace Database\Factories;

use App\Models\Compra;
use App\Models\Proveedor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Compra>
 */
class CompraFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'factura' => strtoupper(fake()->unique()->bothify('FA-####')),
            'proveedor_id' => Proveedor::factory(),
            'fecha' => fake()->dateTimeThisYear(),
            'estado' => 'PENDIENTE',
            'observaciones' => fake()->optional()->sentence(),
            'subtotal' => 0,
            'descuento' => 0,
            'total_a_pagar' => 0,
        ];
    }
}
