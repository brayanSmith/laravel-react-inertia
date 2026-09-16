<?php

namespace App\Http\Controllers;

use App\Http\Requests\Categorias\SaveSubCategoriaRequest;
use App\Models\Categoria;
use App\Models\SubCategoria;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class SubCategoriaController extends Controller
{
    /**
     * Store a newly created subcategory for the given category.
     */
    public function store(SaveSubCategoriaRequest $request, Team $current_team, Categoria $categoria): RedirectResponse
    {
        $categoria->subCategorias()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Subcategoría creada.')]);

        return back();
    }

    /**
     * Update the specified subcategory.
     */
    public function update(SaveSubCategoriaRequest $request, Team $current_team, Categoria $categoria, SubCategoria $subcategoria): RedirectResponse
    {
        $subcategoria->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Subcategoría actualizada.')]);

        return back();
    }

    /**
     * Remove the specified subcategory.
     */
    public function destroy(Team $current_team, Categoria $categoria, SubCategoria $subcategoria): RedirectResponse
    {
        $subcategoria->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Subcategoría eliminada.')]);

        return back();
    }
}
