import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Props = {
    onClose: () => void;
};

const ATAJOS: { grupo: string; items: { teclas: string; accion: string }[] }[] =
    [
        {
            grupo: 'Pantalla del POS',
            items: [
                { teclas: 'F1', accion: 'Ver estos atajos' },
                { teclas: 'F2', accion: 'Buscar producto' },
                { teclas: 'F3', accion: 'Seleccionar / cambiar cliente' },
                { teclas: 'F4', accion: 'Nuevo producto' },
                { teclas: 'F7', accion: 'Actualizar inventario' },
                { teclas: 'F8', accion: 'Resetear pedido' },
                { teclas: 'F9', accion: 'Proceder al pago' },
                { teclas: 'F10', accion: 'Historial de pedidos' },
                { teclas: 'Alt + N', accion: 'Nueva venta (pestaña)' },
                { teclas: 'Alt + 1…9', accion: 'Ir a la venta N' },
            ],
        },
        {
            grupo: 'Al agregar un producto',
            items: [
                { teclas: '+', accion: 'Sumar una unidad' },
                { teclas: '−', accion: 'Restar una unidad' },
                { teclas: 'Enter', accion: 'Agregar al carrito' },
            ],
        },
        {
            grupo: 'En el pago y al finalizar',
            items: [
                { teclas: 'F9', accion: 'Finalizar venta / imprimir voucher' },
                { teclas: 'Esc', accion: 'Cerrar la ventana' },
            ],
        },
    ];

/** The POS keyboard shortcuts, opened with F1. */
export default function PosAtajosModal({ onClose }: Props) {
    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md" data-test="pos-atajos-modal">
                <DialogHeader>
                    <DialogTitle>Atajos de teclado</DialogTitle>
                    <DialogDescription>
                        Trabaja sin el mouse con estas teclas.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    {ATAJOS.map((grupo) => (
                        <div key={grupo.grupo} className="grid gap-1.5">
                            <p className="text-muted-foreground text-xs font-semibold uppercase">
                                {grupo.grupo}
                            </p>
                            {grupo.items.map((item) => (
                                <div
                                    key={item.teclas + item.accion}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span>{item.accion}</span>
                                    <kbd className="bg-muted rounded border px-2 py-0.5 text-xs font-medium">
                                        {item.teclas}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
