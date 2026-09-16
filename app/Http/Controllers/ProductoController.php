<?php

namespace App\Http\Controllers;

use App\Http\Requests\Productos\StoreProductoRequest;
use App\Http\Requests\Productos\UpdateProductoRequest;
use App\Models\Producto;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductoController extends Controller
{
    private const string IMAGE_DISK = 'public';

    private const string IMAGE_DIRECTORY = 'productos';

    /**
     * Display a listing of the products.
     */
    public function index(): Response
    {
        return Inertia::render('productos/index', [
            'productos' => Producto::query()
                ->orderBy('nombre')
                ->get(['id', 'codigo', 'nombre', 'descripcion', 'costo', 'precio_detal', 'precio_mayorista', 'precio_especial', 'imagen'])
                ->map(fn (Producto $producto) => [
                    'id' => $producto->id,
                    'codigo' => $producto->codigo,
                    'nombre' => $producto->nombre,
                    'descripcion' => $producto->descripcion,
                    'costo' => $producto->costo,
                    'precio_detal' => $producto->precio_detal,
                    'precio_mayorista' => $producto->precio_mayorista,
                    'precio_especial' => $producto->precio_especial,
                    'imagen' => $producto->imagen ? Storage::disk(self::IMAGE_DISK)->url($producto->imagen) : null,
                ]),
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(StoreProductoRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('imagen')) {
            $data['imagen'] = $this->storeImagen($request->file('imagen'));
        }

        Producto::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Producto creado.')]);

        return back();
    }

    /**
     * Update the specified product.
     */
    public function update(UpdateProductoRequest $request, Team $current_team, Producto $producto): RedirectResponse
    {
        $data = $request->safe()->except(['remove_imagen', 'imagen']);

        if ($request->hasFile('imagen')) {
            $this->deleteImagen($producto->imagen);
            $data['imagen'] = $this->storeImagen($request->file('imagen'));
        } elseif ($request->boolean('remove_imagen')) {
            $this->deleteImagen($producto->imagen);
            $data['imagen'] = null;
        }

        $producto->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Producto actualizado.')]);

        return back();
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Team $current_team, Producto $producto): RedirectResponse
    {
        $producto->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Producto eliminado.')]);

        return back();
    }

    /**
     * Store the uploaded product image and return its disk path.
     */
    private function storeImagen(UploadedFile $file): string
    {
        return $file->store(self::IMAGE_DIRECTORY, self::IMAGE_DISK);
    }

    /**
     * Delete a product image from disk, if it exists.
     */
    private function deleteImagen(?string $path): void
    {
        if ($path !== null) {
            Storage::disk(self::IMAGE_DISK)->delete($path);
        }
    }
}
