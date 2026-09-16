<?php

use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\SubCategoriaController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        Route::get('clientes', [ClienteController::class, 'index'])->name('clientes.index');
        Route::post('clientes', [ClienteController::class, 'store'])->name('clientes.store');
        Route::patch('clientes/{cliente}', [ClienteController::class, 'update'])->name('clientes.update');
        Route::delete('clientes/{cliente}', [ClienteController::class, 'destroy'])->name('clientes.destroy');

        Route::get('productos', [ProductoController::class, 'index'])->name('productos.index');
        Route::post('productos', [ProductoController::class, 'store'])->name('productos.store');
        Route::patch('productos/{producto}', [ProductoController::class, 'update'])->name('productos.update');
        Route::delete('productos/{producto}', [ProductoController::class, 'destroy'])->name('productos.destroy');

        Route::get('categorias', [CategoriaController::class, 'index'])->name('categorias.index');
        Route::post('categorias', [CategoriaController::class, 'store'])->name('categorias.store');
        Route::patch('categorias/{categoria}', [CategoriaController::class, 'update'])->name('categorias.update');
        Route::delete('categorias/{categoria}', [CategoriaController::class, 'destroy'])->name('categorias.destroy');

        Route::post('categorias/{categoria}/subcategorias', [SubCategoriaController::class, 'store'])->name('categorias.subcategorias.store');
        Route::patch('categorias/{categoria}/subcategorias/{subcategoria}', [SubCategoriaController::class, 'update'])->name('categorias.subcategorias.update');
        Route::delete('categorias/{categoria}/subcategorias/{subcategoria}', [SubCategoriaController::class, 'destroy'])->name('categorias.subcategorias.destroy');
    });

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
