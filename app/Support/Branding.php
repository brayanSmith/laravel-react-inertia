<?php

namespace App\Support;

use App\Models\Empresa;

/**
 * The company saved in "Empresas" brands the app: its name replaces the
 * framework name and its logo is the app icon. Resolved once per request
 * (scoped binding) and shared by the Inertia props and the root Blade view.
 */
class Branding
{
    private ?Empresa $empresa = null;

    private bool $cargada = false;

    public function name(): string
    {
        return $this->empresa()?->nombre_empresa ?: config('app.name', 'Laravel');
    }

    public function logoUrl(): ?string
    {
        return $this->empresa()?->logo_empresa_url;
    }

    private function empresa(): ?Empresa
    {
        if (! $this->cargada) {
            $this->empresa = Empresa::first();
            $this->cargada = true;
        }

        return $this->empresa;
    }
}
