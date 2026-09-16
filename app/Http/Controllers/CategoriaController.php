<?php

namespace App\Http\Controllers;

use App\Http\Requests\Categorias\SaveCategoriaRequest;
use App\Models\Categoria;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CategoriaController extends Controller
{
    /**
     * Display a listing of the categories.
     */
    public function index(): Response
    {
        return Inertia::render('categorias/index', [
            'categorias' => Categoria::query()
                ->withCount(['subCategorias', 'productos'])
                ->with(['subCategorias' => fn ($query) => $query
                    ->withCount('productos')
                    ->orderBy('nombre')
                    ->select(['id', 'categoria_id', 'nombre', 'descripcion'])])
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'descripcion']),
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(SaveCategoriaRequest $request): RedirectResponse
    {
        Categoria::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Categoría creada.')]);

        return back();
    }

    /**
     * Update the specified category.
     */
    public function update(SaveCategoriaRequest $request, Team $current_team, Categoria $categoria): RedirectResponse
    {
        $categoria->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Categoría actualizada.')]);

        return back();
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Team $current_team, Categoria $categoria): RedirectResponse
    {
        $categoria->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Categoría eliminada.')]);

        return back();
    }
}
