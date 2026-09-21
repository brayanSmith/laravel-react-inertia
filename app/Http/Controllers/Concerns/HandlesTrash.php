<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

/**
 * The "deleted records" view and the restore action shared by every
 * soft-deleting module. Seeing and restoring deleted records needs the same
 * permission as deleting them (`{resource}.delete`).
 */
trait HandlesTrash
{
    /**
     * Whether this request asks for the deleted records (`?eliminados=1`)
     * and the user may see them.
     */
    protected function verEliminados(Request $request, string $permissionResource): bool
    {
        return $request->boolean('eliminados')
            && $request->user()->can("{$permissionResource}.delete");
    }

    /**
     * Restore a soft-deleted record and go back to the deleted-records list.
     *
     * @template TModel of Model
     *
     * @param  TModel  $model
     * @param  callable(TModel): void|null  $afterRestore  Extra work done in the same call (e.g. re-applying stock).
     */
    protected function restaurarRegistro(
        string $permissionResource,
        Model $model,
        string $message,
        ?callable $afterRestore = null,
    ): RedirectResponse {
        Gate::authorize("{$permissionResource}.delete");

        $model->restore();

        if ($afterRestore) {
            $afterRestore($model);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
