<?php

use App\Http\Controllers\BodegaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MarcaController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\PucController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Controllers\UsuarioController;
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

        Route::get('usuarios', [UsuarioController::class, 'index'])->name('usuarios.index');
        Route::post('usuarios', [UsuarioController::class, 'store'])->name('usuarios.store');
        Route::patch('usuarios/{usuario}', [UsuarioController::class, 'update'])->name('usuarios.update');
        Route::delete('usuarios/{usuario}', [UsuarioController::class, 'destroy'])->name('usuarios.destroy');

        Route::get('bodegas', [BodegaController::class, 'index'])->name('bodegas.index');
        Route::post('bodegas', [BodegaController::class, 'store'])->name('bodegas.store');
        Route::patch('bodegas/{bodega}', [BodegaController::class, 'update'])->name('bodegas.update');
        Route::delete('bodegas/{bodega}', [BodegaController::class, 'destroy'])->name('bodegas.destroy');

        Route::get('proveedores', [ProveedorController::class, 'index'])->name('proveedores.index');
        Route::post('proveedores', [ProveedorController::class, 'store'])->name('proveedores.store');
        Route::patch('proveedores/{proveedor}', [ProveedorController::class, 'update'])->name('proveedores.update');
        Route::delete('proveedores/{proveedor}', [ProveedorController::class, 'destroy'])->name('proveedores.destroy');

        Route::get('marcas', [MarcaController::class, 'index'])->name('marcas.index');
        Route::post('marcas', [MarcaController::class, 'store'])->name('marcas.store');
        Route::patch('marcas/{marca}', [MarcaController::class, 'update'])->name('marcas.update');
        Route::delete('marcas/{marca}', [MarcaController::class, 'destroy'])->name('marcas.destroy');

        Route::get('pucs', [PucController::class, 'index'])->name('pucs.index');
        Route::post('pucs', [PucController::class, 'store'])->name('pucs.store');
        Route::patch('pucs/{puc}', [PucController::class, 'update'])->name('pucs.update');
        Route::delete('pucs/{puc}', [PucController::class, 'destroy'])->name('pucs.destroy');
    });

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
