<?php

namespace Database\Factories;

use App\Models\Marca;
use App\Models\Producto;
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
        $ancho = fake()->randomElement(['155', '175', '185', '195']);
        $rin = fake()->randomElement(['13', '14', '15', '16']);
        $referencia = "{$ancho}R{$rin}";
        $descripcion = fake()->bothify('#PR/WR0##/##/##N');

        return [
            'categoria' => 'LLANTA',
            'tipo' => 'NUEVO',
            'inventariable' => true,
            'ancho' => $ancho,
            'perfil' => null,
            'construccion' => 'R',
            'rin' => $rin,
            'tipo_vehiculo' => 'CARRO',
            'diametro' => null,
            'marca_id' => null,
            'referencia_producto' => $referencia,
            'descripcion_producto' => $descripcion,
            'costo_producto' => fake()->randomFloat(2, 50000, 200000),
            'valor_detal' => fake()->randomFloat(2, 100000, 300000),
            'valor_mayorista' => fake()->randomFloat(2, 80000, 250000),
            'valor_sin_instalacion' => 0,
            'imagen_producto' => null,
            'concatenar_codigo_nombre' => $referencia.'-'.$descripcion,
            'codigo_appsheet' => null,
            'sku' => fake()->unique()->numerify('########'),
        ];
    }

    /**
     * Indicate that the producto has a brand.
     */
    public function withMarca(): static
    {
        return $this->state(fn () => ['marca_id' => Marca::factory()]);
    }
}
