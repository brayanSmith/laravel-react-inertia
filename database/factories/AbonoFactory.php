<?php

namespace Database\Factories;

use App\Models\Abono;
use App\Models\Pedido;
use App\Models\Puc;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Abono>
 */
class AbonoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $monto = fake()->randomFloat(2, 10, 500);

        return [
            'fecha' => fake()->dateTimeThisYear(),
            'monto' => $monto,
            'con_cuanto_pago' => $monto,
            'cambio' => 0,
            'puc_id' => Puc::factory(),
            'descripcion' => fake()->optional()->sentence(),
            'pedido_id' => Pedido::factory(),
            'user_id' => User::factory(),
            'vendedor_id' => User::factory(),
        ];
    }
}
