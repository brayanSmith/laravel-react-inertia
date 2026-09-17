<?php

namespace Database\Factories;

use App\Models\Proveedor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Proveedor>
 */
class ProveedorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre_proveedor' => fake()->company(),
            'razon_social_proveedor' => fake()->company().' S.A.S.',
            'nit_proveedor' => fake()->unique()->numerify('#########-#'),
            'rut_proveedor_imagen' => null,
            'tipo_proveedor' => 'REMISIONADO',
            'categoria_proveedor' => 'NO_DECLARANTE',
            'departamento_proveedor' => fake()->city(),
            'ciudad_proveedor' => fake()->city(),
            'direccion_proveedor' => fake()->streetAddress(),
            'telefono_proveedor' => fake()->phoneNumber(),
            'banco_proveedor' => fake()->company().' Bank',
            'tipo_cuenta_proveedor' => 'AHORRO',
            'numero_cuenta_proveedor' => fake()->numerify('##########'),
            'convenio' => null,
            'tiempo_respuesta' => '3 días',
            'fabricante' => null,
            'flete' => false,
            'valor_flete' => 0,
        ];
    }
}
