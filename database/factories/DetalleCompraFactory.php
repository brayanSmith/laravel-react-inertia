<?php

namespace Database\Factories;

use App\Models\Bodega;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\Producto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DetalleCompra>
 */
class DetalleCompraFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $cantidad = fake()->randomFloat(2, 1, 20);
        $precioUnitario = fake()->randomFloat(2, 10000, 200000);

        return [
            'compra_id' => Compra::factory(),
            'producto_id' => Producto::factory(),
            'bodega_id' => Bodega::factory(),
            'estado_entrega' => 'PENDIENTE',
            'cantidad' => $cantidad,
            'precio_unitario' => $precioUnitario,
            'subtotal' => $cantidad * $precioUnitario,
        ];
    }
}
