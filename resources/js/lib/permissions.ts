export function groupPermissionsByResource(
    permissions: string[],
): Record<string, string[]> {
    return permissions.reduce<Record<string, string[]>>((groups, name) => {
        const [resource] = name.split('.');

        (groups[resource] ??= []).push(name);

        return groups;
    }, {});
}

const RESOURCE_LABELS: Record<string, string> = {
    clientes: 'Clientes',
    usuarios: 'Usuarios',
    bodegas: 'Bodegas',
    proveedores: 'Proveedores',
    marcas: 'Marcas',
    puc: 'PUC',
    empresa: 'Empresa',
    productos: 'Productos',
    gastos: 'Gastos',
    compras: 'Compras',
    pedidos: 'Pedidos',
    'pedidos-mayoristas': 'Pedidos mayorista',
    'stock-iniciales': 'Stock inicial',
    'stock-bodegas': 'Stock por bodega',
    cotizador: 'Cotizador',
    pos: 'POS',
    'inicios-sesion': 'Inicios de sesión',
    historial: 'Historial de cambios',
    traslados: 'Traslados',
    dashboard: 'Panel',
    team: 'Equipo',
};

const ACTION_LABELS: Record<string, string> = {
    view: 'Ver',
    create: 'Crear',
    update: 'Editar',
    delete: 'Eliminar',
    'view-deleted': 'Ver eliminados',
    restore: 'Restaurar eliminados',
    'view-detalle': 'Ver pedidos por detalle',
    'create-abono': 'Registrar abonos',
    'update-abono': 'Editar abonos',
    'delete-abono': 'Eliminar abonos',
    'create-detalle': 'Agregar productos',
    'update-detalle': 'Editar productos',
    'delete-detalle': 'Eliminar productos',
    'update-datos': 'Editar datos generales (excepto observaciones)',
    'view-inversion': 'Ver inversión',
    'create-producto': 'Crear productos',
    'create-cliente': 'Crear clientes',
    'widget-productos': 'Widget: total de productos vendidos',
    'widget-ganancia': 'Widget: valor de la ganancia',
    'widget-ajustes': 'Widget: ajustes (reteica, retefuente, descuento)',
    'tabla-bodegas': 'Tabla de cantidad por bodega',
    'chart-categorias': 'Gráfico: productos vendidos por categoría',
    'chart-top-productos': 'Gráfico: 10 productos más vendidos',
    'chart-pedidos': 'Gráfico: pedidos, gastos + inversión y ganancia',
    'alerta-stock': 'Alerta: productos sin stock con ventas',
    'view-all-pedidos': 'Ver el historial de todos los pedidos',
};

/** Extra explanation shown as a tooltip next to a permission. */
const ACTION_HINTS: Record<string, string> = {
    'view-all-pedidos':
        'Desmarcado, en el POS solo se ve el historial de los pedidos del vendedor autenticado.',
    'update-datos':
        'Cliente, fecha, vendedor, bodega, tipo de precio, placa, facturación, flete, descuento y retenciones. La observación y la observación de pago siempre se pueden editar con "Editar".',
    'create-abono': 'Solo aplica en el formulario de edición del pedido.',
    'create-detalle': 'Solo aplica en el formulario de edición del pedido.',
};

/** A permission name (`pedidos.create-abono`) as the label people read ("Registrar abonos"). */
export function permissionLabel(name: string): string {
    const [, ...rest] = name.split('.');
    const action = rest.join('.');

    return ACTION_LABELS[action] ?? action.replace(/[-_.]/g, ' ');
}

export function permissionHint(name: string): string | undefined {
    const [, ...rest] = name.split('.');

    return ACTION_HINTS[rest.join('.')];
}

export function resourceLabel(resource: string): string {
    return RESOURCE_LABELS[resource] ?? resource;
}
