<?php

use App\Http\Controllers\AbonoController;
use App\Http\Controllers\BodegaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\CotizadorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\GastoController;
use App\Http\Controllers\InicioSesionController;
use App\Http\Controllers\MarcaController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\PucController;
use App\Http\Controllers\StockBodegaController;
use App\Http\Controllers\StockInicialController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Controllers\TrasladoController;
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

        Route::get('gastos', [GastoController::class, 'index'])->name('gastos.index');
        Route::post('gastos', [GastoController::class, 'store'])->name('gastos.store');
        Route::patch('gastos/{gasto}', [GastoController::class, 'update'])->name('gastos.update');
        Route::delete('gastos/{gasto}', [GastoController::class, 'destroy'])->name('gastos.destroy');

        Route::get('inicios-sesion', [InicioSesionController::class, 'index'])->name('inicios-sesion.index');

        Route::get('cotizador', [CotizadorController::class, 'index'])->name('cotizador.index');

        Route::get('pos', [PosController::class, 'index'])->name('pos.index');
        Route::post('pos', [PosController::class, 'store'])->name('pos.store');
        Route::get('pos/pedidos', [PosController::class, 'pedidos'])->name('pos.pedidos');
        Route::get('pos/pedidos/{pedido}/voucher', [PosController::class, 'voucher'])->name('pos.pedidos.voucher');
        Route::get('pos/clientes/{cliente}/pedidos', [PosController::class, 'clientePedidos'])->name('pos.clientes.pedidos');

        Route::get('compras', [CompraController::class, 'index'])->name('compras.index');
        Route::get('compras/crear', [CompraController::class, 'create'])->name('compras.create');
        Route::post('compras', [CompraController::class, 'store'])->name('compras.store');
        Route::get('compras/{compra}/editar', [CompraController::class, 'edit'])->name('compras.edit');
        Route::patch('compras/{compra}', [CompraController::class, 'update'])->name('compras.update');
        Route::delete('compras/{compra}', [CompraController::class, 'destroy'])->name('compras.destroy');

        Route::get('pedidos', [PedidoController::class, 'index'])->name('pedidos.index');
        Route::get('pedidos/crear', [PedidoController::class, 'create'])->name('pedidos.create');
        Route::post('pedidos', [PedidoController::class, 'store'])->name('pedidos.store');
        Route::get('pedidos/{pedido}/editar', [PedidoController::class, 'edit'])->name('pedidos.edit');
        Route::patch('pedidos/{pedido}', [PedidoController::class, 'update'])->name('pedidos.update');
        Route::delete('pedidos/{pedido}', [PedidoController::class, 'destroy'])->name('pedidos.destroy');

        Route::post('pedidos/{pedido}/abonos', [AbonoController::class, 'store'])->name('pedidos.abonos.store');
        Route::patch('pedidos/{pedido}/abonos/{abono}', [AbonoController::class, 'update'])->name('pedidos.abonos.update');
        Route::delete('pedidos/{pedido}/abonos/{abono}', [AbonoController::class, 'destroy'])->name('pedidos.abonos.destroy');

        // Same controllers as "pedidos" above; PedidoController/AbonoController scope
        // themselves to DETAL vs MAYORISTA by reading the matched route's name.
        Route::get('pedidos-mayoristas', [PedidoController::class, 'index'])->name('pedidos-mayoristas.index');
        Route::get('pedidos-mayoristas/crear', [PedidoController::class, 'create'])->name('pedidos-mayoristas.create');
        Route::post('pedidos-mayoristas', [PedidoController::class, 'store'])->name('pedidos-mayoristas.store');
        Route::get('pedidos-mayoristas/{pedido}/editar', [PedidoController::class, 'edit'])->name('pedidos-mayoristas.edit');
        Route::patch('pedidos-mayoristas/{pedido}', [PedidoController::class, 'update'])->name('pedidos-mayoristas.update');
        Route::delete('pedidos-mayoristas/{pedido}', [PedidoController::class, 'destroy'])->name('pedidos-mayoristas.destroy');

        Route::post('pedidos-mayoristas/{pedido}/abonos', [AbonoController::class, 'store'])->name('pedidos-mayoristas.abonos.store');
        Route::patch('pedidos-mayoristas/{pedido}/abonos/{abono}', [AbonoController::class, 'update'])->name('pedidos-mayoristas.abonos.update');
        Route::delete('pedidos-mayoristas/{pedido}/abonos/{abono}', [AbonoController::class, 'destroy'])->name('pedidos-mayoristas.abonos.destroy');

        Route::get('empresa', [EmpresaController::class, 'edit'])->name('empresa.edit');
        Route::patch('empresa', [EmpresaController::class, 'update'])->name('empresa.update');

        Route::get('productos', [ProductoController::class, 'index'])->name('productos.index');
        Route::get('productos/crear', [ProductoController::class, 'create'])->name('productos.create');
        Route::post('productos', [ProductoController::class, 'store'])->name('productos.store');
        Route::get('productos/{producto}', [ProductoController::class, 'show'])->name('productos.show');
        Route::get('productos/{producto}/detalles', [ProductoController::class, 'detalles'])->name('productos.detalles');
        Route::get('productos/{producto}/editar', [ProductoController::class, 'edit'])->name('productos.edit');
        Route::patch('productos/{producto}', [ProductoController::class, 'update'])->name('productos.update');
        Route::delete('productos/{producto}', [ProductoController::class, 'destroy'])->name('productos.destroy');

        Route::get('stock-iniciales', [StockInicialController::class, 'index'])->name('stock-iniciales.index');
        Route::post('stock-iniciales', [StockInicialController::class, 'store'])->name('stock-iniciales.store');
        Route::patch('stock-iniciales/{stock_inicial}', [StockInicialController::class, 'update'])->name('stock-iniciales.update');
        Route::delete('stock-iniciales/{stock_inicial}', [StockInicialController::class, 'destroy'])->name('stock-iniciales.destroy');

        Route::get('stock-bodegas', [StockBodegaController::class, 'index'])->name('stock-bodegas.index');

        Route::get('traslados', [TrasladoController::class, 'index'])->name('traslados.index');
        Route::post('traslados', [TrasladoController::class, 'store'])->name('traslados.store');
        Route::patch('traslados/{traslado}', [TrasladoController::class, 'update'])->name('traslados.update');
        Route::delete('traslados/{traslado}', [TrasladoController::class, 'destroy'])->name('traslados.destroy');
    });

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
