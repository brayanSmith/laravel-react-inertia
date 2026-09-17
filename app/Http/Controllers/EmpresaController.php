<?php

namespace App\Http\Controllers;

use App\Http\Requests\Empresas\UpdateEmpresaRequest;
use App\Models\Empresa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmpresaController extends Controller
{
    /**
     * Show the company profile settings page.
     */
    public function edit(Request $request): Response
    {
        Gate::authorize('empresa.view');

        return Inertia::render('empresa/edit', [
            'empresa' => Empresa::first(),
            'permissions' => [
                'canUpdate' => $request->user()->can('empresa.update'),
            ],
        ]);
    }

    /**
     * Create or update the company profile.
     */
    public function update(UpdateEmpresaRequest $request): RedirectResponse
    {
        Gate::authorize('empresa.update');

        $empresa = Empresa::first();
        $data = $request->safe()->except(['logo_empresa', 'remove_logo_empresa']);

        if ($request->hasFile('logo_empresa')) {
            if ($empresa?->logo_empresa) {
                Storage::disk('public')->delete($empresa->logo_empresa);
            }

            $data['logo_empresa'] = $request->file('logo_empresa')->store('empresa', 'public');
        } elseif ($request->boolean('remove_logo_empresa') && $empresa?->logo_empresa) {
            Storage::disk('public')->delete($empresa->logo_empresa);
            $data['logo_empresa'] = null;
        }

        if ($empresa) {
            $empresa->update($data);
        } else {
            Empresa::create($data);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Company profile updated.')]);

        return to_route('empresa.edit');
    }
}
