<?php

use App\Http\Controllers\BodegaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\DashboardController;
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
    });

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
