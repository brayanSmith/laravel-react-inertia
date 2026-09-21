import { useTiposPrecio } from '@/hooks/use-tipos-precio';
import {
    History,
    RotateCcw,
    ShoppingCart,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useMemo } from 'react';
import Combobox from '@/components/combobox';
import InputError from '@/components/input-error';
import PosCartItem from '@/components/pos/pos-cart-item';
import PosClienteCard from '@/components/pos/pos-cliente-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { PosCartLine } from '@/hooks/use-pos-cart';
import type { PosHeaderState } from '@/hooks/use-pos-header';
import { calcularTotales } from '@/lib/pos-totals';
import type {
    BodegaOption,
    ClienteOption,
    TipoPrecioPedido,
    VendedorOption,
} from '@/types';

type CartApi = {
    lines: PosCartLine[];
    setCantidad: (key: string, cantidad: number) => void;
    setPrecioUnitario: (key: string, precio: number) => void;
    removeLine: (key: string) => void;
    clear: () => void;
    totalBruto: number;
};

type Props = {
    cliente: ClienteOption | null;
    onOpenClientePicker: () => void;
    onOpenHistorial: () => void;
    onProceedToPay: () => void;
    onReset: () => void;
    /** Whether the pedido has what it needs to go to payment. */
    canProceder: boolean;
    bodegas: BodegaOption[];
    vendedores: VendedorOption[];
    header: PosHeaderState;
    onFieldChange: <K extends keyof PosHeaderState>(
        key: K,
        value: PosHeaderState[K],
    ) => void;
    cart: CartApi;
    onEditLine: (line: PosCartLine) => void;
    errors: Partial<Record<string, string>>;
    processing: boolean;
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

/**
 * The right panel: the pedido's data and cart in a scrollable body, with
 * the totals and the pay / reset buttons pinned at the bottom so they are
 * always in reach however long the cart gets.
 */
export default function PosCartPanel({
    cliente,
    onOpenClientePicker,
    onOpenHistorial,
    onProceedToPay,
    onReset,
    canProceder,
    bodegas,
    vendedores,
    header,
    onFieldChange,
    cart,
    onEditLine,
    errors,
    processing,
}: Props) {
    const { tiposPedido } = useTiposPrecio();
    const bodegaOptions = useMemo(
        () =>
            bodegas.map((bodega) => ({
                value: String(bodega.id),
                label: bodega.nombre_bodega,
            })),
        [bodegas],
    );
    const vendedorOptions = useMemo(
        () =>
            vendedores.map((vendedor) => ({
                value: String(vendedor.id),
                label: vendedor.name,
            })),
        [vendedores],
    );

    const { subtotal, total } = calcularTotales(cart.totalBruto, header);

    return (
        <div className="bg-card flex flex-col overflow-hidden rounded-lg border lg:max-h-[calc(100vh-2rem)]">
            <div className="bg-primary text-primary-foreground flex shrink-0 items-center justify-between p-4">
                <span className="flex items-center gap-2 font-semibold">
                    <ShoppingCart className="size-4" />
                    Facturar
                </span>
                <span className="font-semibold">
                    {currencyFormatter.format(total)}
                </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
                <div className="grid gap-2">
                    <Label>Cliente</Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 justify-start"
                            onClick={onOpenClientePicker}
                            data-test="pos-cliente"
                        >
                            <UserRound className="size-4" />
                            {cliente
                                ? 'Cambiar cliente'
                                : 'Seleccionar cliente'}
                            <kbd className="text-muted-foreground ml-auto text-xs">
                                F3
                            </kbd>
                        </Button>
                        {cliente ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onOpenHistorial}
                                data-test="pos-cliente-historial"
                            >
                                <History className="size-4" />
                                Historial
                            </Button>
                        ) : null}
                    </div>
                    {cliente ? <PosClienteCard cliente={cliente} /> : null}
                    <InputError message={errors.cliente_id} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                        <Label>Bodega</Label>
                        <Combobox
                            options={bodegaOptions}
                            value={header.bodegaId}
                            onValueChange={(value) =>
                                onFieldChange('bodegaId', value)
                            }
                            searchPlaceholder="Buscar bodega..."
                            emptyText="No se encontraron bodegas."
                            dataTest="pos-bodega"
                        />
                        <InputError message={errors.bodega_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Vendedor</Label>
                        <Combobox
                            options={vendedorOptions}
                            value={header.vendedorId}
                            onValueChange={(value) =>
                                onFieldChange('vendedorId', value)
                            }
                            searchPlaceholder="Buscar vendedor..."
                            emptyText="No se encontraron vendedores."
                            dataTest="pos-vendedor"
                        />
                        <InputError message={errors.user_id} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label>Tipo de precio</Label>
                    <Select
                        value={header.tipoPrecio}
                        onValueChange={(value) =>
                            onFieldChange(
                                'tipoPrecio',
                                value as TipoPrecioPedido,
                            )
                        }
                    >
                        <SelectTrigger
                            className="w-full"
                            data-test="pos-tipo-precio"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {tiposPedido.includes('DETAL') ? (
                                <SelectItem value="DETAL">Detal</SelectItem>
                            ) : null}
                            {tiposPedido.includes('MAYORISTA') ? (
                                <SelectItem value="MAYORISTA">
                                    Mayorista
                                </SelectItem>
                            ) : null}
                            {tiposPedido.includes('OTRO') ? (
                                <SelectItem value="OTRO">Costo</SelectItem>
                            ) : null}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.tipo_precio} />
                </div>

                <div className="grid gap-1">
                    <div className="flex items-center justify-between">
                        <Label>Productos agregados</Label>
                        {cart.lines.length > 0 ? (
                            <button
                                type="button"
                                onClick={cart.clear}
                                data-test="pos-remover-lista"
                                className="text-muted-foreground hover:text-destructive flex items-center gap-1 text-xs"
                            >
                                <Trash2 className="size-3.5" />
                                Remover lista
                            </button>
                        ) : null}
                    </div>

                    {cart.lines.length === 0 ? (
                        <p className="text-muted-foreground py-4 text-center text-sm">
                            Tu carrito está vacío.
                        </p>
                    ) : (
                        <div>
                            {cart.lines.map((line) => (
                                <PosCartItem
                                    key={line.key}
                                    line={line}
                                    onCantidadChange={(cantidad) =>
                                        cart.setCantidad(line.key, cantidad)
                                    }
                                    onPrecioChange={(precio) =>
                                        cart.setPrecioUnitario(line.key, precio)
                                    }
                                    onEdit={() => onEditLine(line)}
                                    onRemove={() => cart.removeLine(line.key)}
                                />
                            ))}
                        </div>
                    )}
                    <InputError message={errors.detalles} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="pos-placa">Placa</Label>
                    <Input
                        id="pos-placa"
                        value={header.placa}
                        onChange={(event) =>
                            onFieldChange('placa', event.target.value)
                        }
                        data-test="pos-placa"
                    />
                    <InputError message={errors.placa} />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <Label
                        htmlFor="pos-aplica-turno"
                        className="flex items-center gap-2"
                    >
                        <Switch
                            id="pos-aplica-turno"
                            checked={header.aplicaTurno}
                            onCheckedChange={(checked) =>
                                onFieldChange('aplicaTurno', checked)
                            }
                            data-test="pos-aplica-turno"
                        />
                        Aplica turno
                    </Label>

                    <Label
                        htmlFor="pos-facturacion-electronica"
                        className="flex items-center gap-2"
                    >
                        <Checkbox
                            id="pos-facturacion-electronica"
                            checked={header.facturacionElectronica}
                            onCheckedChange={(checked) =>
                                onFieldChange(
                                    'facturacionElectronica',
                                    checked === true,
                                )
                            }
                            data-test="pos-facturacion-electronica"
                        />
                        Facturación electrónica
                    </Label>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="pos-observacion">Observación</Label>
                    <Textarea
                        id="pos-observacion"
                        rows={2}
                        value={header.observacion}
                        onChange={(event) =>
                            onFieldChange('observacion', event.target.value)
                        }
                        data-test="pos-observacion"
                    />
                    <InputError message={errors.observacion} />
                </div>
            </div>

            <div className="bg-card shrink-0 space-y-3 border-t p-4">
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            Total Bruto:
                        </span>
                        <span>{currencyFormatter.format(cart.totalBruto)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>{currencyFormatter.format(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold">
                        <span>Total:</span>
                        <span>{currencyFormatter.format(total)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        disabled={!canProceder || processing}
                        onClick={onProceedToPay}
                        data-test="pos-proceder-pago"
                    >
                        Proceder al Pago
                        <kbd className="text-xs opacity-70">F9</kbd>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={processing}
                        onClick={onReset}
                        data-test="pos-resetear-pedido"
                    >
                        <RotateCcw className="size-4" />
                        Resetear pedido
                        <kbd className="text-xs opacity-70">F8</kbd>
                    </Button>
                </div>
            </div>
        </div>
    );
}
