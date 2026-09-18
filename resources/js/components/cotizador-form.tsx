import { Check, Copy, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CotizadorProducto, TipoPrecioCotizador } from '@/types';

type Props = {
    productos: CotizadorProducto[];
    tipoPrecioRestringido: TipoPrecioCotizador | null;
};

const numberFormatter = new Intl.NumberFormat('es-CO');

function formatearPrecio(precio: string | number | null | undefined): string {
    return numberFormatter.format(Number(precio) || 0);
}

export default function CotizadorForm({
    productos,
    tipoPrecioRestringido,
}: Props) {
    const [referencia, setReferencia] = useState('');
    const [tipoPrecio, setTipoPrecio] = useState<TipoPrecioCotizador>(
        tipoPrecioRestringido ?? 'DETAL',
    );
    const [resultados, setResultados] = useState<CotizadorProducto[]>([]);
    const [salida, setSalida] = useState('');
    const [copiado, setCopiado] = useState(false);
    const [imagenExpandida, setImagenExpandida] = useState<string | null>(
        null,
    );

    const buscarProducto = () => {
        const referenciaBuscada = referencia.trim();
        const productosEncontrados = productos.filter(
            (producto) => producto.referencia_producto === referenciaBuscada,
        );

        setResultados(productosEncontrados);
        setImagenExpandida(null);

        if (productosEncontrados.length === 0) {
            setSalida(
                referenciaBuscada
                    ? `No se encontró ningún producto con la referencia: ${referenciaBuscada}`
                    : '',
            );
            return;
        }

        let texto = `*Modelos para la referencia ${referenciaBuscada}:*\n`;
        const notas: string[] = [];

        productosEncontrados.forEach((producto) => {
            const nombre = producto.concatenar_codigo_nombre ?? '';

            if (tipoPrecio === 'MAYORISTA') {
                const stock = Number(producto.stock_total || 0);
                texto += `\n• ${nombre}: _(${stock} Und)_ : $ ${formatearPrecio(producto.valor_mayorista)} \n`;
            } else {
                texto += `\n• ${nombre}: $ ${formatearPrecio(producto.valor_detal)} \n`;
            }

            if (producto.imagen_producto_url) {
                texto += `Ver imagen: ${producto.imagen_producto_url}\n`;
            }

            if (nombre.includes('R13')) {
                const nota =
                    'Aplica x2 unidades. Incluye instalación + válvula.';

                if (!notas.includes(nota)) {
                    notas.push(nota);
                }
            }

            if (nombre.includes('ROVELO') || nombre.includes('WESTLAKE')) {
                const nota = '3 años de garantía.';

                if (!notas.includes(nota)) {
                    notas.push(nota);
                }
            }
        });

        if (notas.length > 0) {
            texto += `\n\n*Notas:*`;
            notas.forEach((nota) => {
                texto += `\n-  ${nota}`;
            });
        }

        texto += `\n\nSujeto a disponibilidad.`;
        setSalida(texto);
    };

    const copiarSalida = () => {
        if (!salida) {
            return;
        }

        navigator.clipboard.writeText(salida).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        });
    };

    return (
        <div className="space-y-4">
            <div className="bg-card space-y-4 rounded-xl border p-6 shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[220px] flex-1">
                        <Input
                            value={referencia}
                            onChange={(event) =>
                                setReferencia(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    buscarProducto();
                                }
                            }}
                            placeholder="Ingrese la referencia del producto"
                            data-test="cotizador-referencia"
                        />
                    </div>

                    <div className="min-w-[180px]">
                        <Select
                            value={tipoPrecio}
                            onValueChange={(value) =>
                                setTipoPrecio(value as TipoPrecioCotizador)
                            }
                            disabled={tipoPrecioRestringido !== null}
                        >
                            <SelectTrigger data-test="cotizador-tipo-precio">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DETAL">
                                    Precio Detal
                                </SelectItem>
                                <SelectItem value="MAYORISTA">
                                    Precio Mayorista
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="button"
                        onClick={buscarProducto}
                        data-test="cotizador-buscar"
                    >
                        <Search className="size-4" />
                        Buscar Producto
                    </Button>

                    <Button
                        type="button"
                        variant={copiado ? 'secondary' : 'default'}
                        className={cn(
                            !copiado &&
                                'bg-emerald-600 text-white hover:bg-emerald-700',
                        )}
                        onClick={copiarSalida}
                        disabled={!salida}
                        data-test="cotizador-copiar"
                    >
                        {copiado ? (
                            <Check className="size-4" />
                        ) : (
                            <Copy className="size-4" />
                        )}
                        {copiado ? '¡Copiado!' : 'Copiar'}
                    </Button>
                </div>

                {salida ? (
                    <div
                        className="bg-muted/40 min-h-[120px] rounded-lg border p-4 text-sm whitespace-pre-line"
                        data-test="cotizador-salida"
                    >
                        {salida}
                    </div>
                ) : null}
            </div>

            {resultados.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                    {resultados.map((producto) => (
                        <div
                            key={producto.id}
                            className="bg-muted/50 flex items-center gap-2 rounded-lg p-2"
                            data-test="cotizador-resultado"
                        >
                            {producto.imagen_producto_url ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setImagenExpandida(
                                            producto.imagen_producto_url,
                                        )
                                    }
                                    className="shrink-0"
                                >
                                    <img
                                        src={producto.imagen_producto_url}
                                        alt={
                                            producto.concatenar_codigo_nombre ??
                                            ''
                                        }
                                        loading="lazy"
                                        className="h-14 w-14 cursor-pointer rounded-md object-cover"
                                    />
                                </button>
                            ) : (
                                <div className="text-muted-foreground bg-muted flex h-14 w-14 shrink-0 items-center justify-center rounded-md text-center text-[10px]">
                                    Sin imagen
                                </div>
                            )}
                            <span className="text-xs">
                                {producto.concatenar_codigo_nombre}
                            </span>
                        </div>
                    ))}
                </div>
            ) : null}

            {imagenExpandida ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setImagenExpandida(null)}
                    data-test="cotizador-imagen-expandida"
                >
                    <button
                        type="button"
                        onClick={() => setImagenExpandida(null)}
                        className="absolute top-4 right-4 text-white"
                    >
                        <X className="size-6" />
                    </button>
                    <img
                        src={imagenExpandida}
                        className="max-h-full max-w-full rounded-lg"
                        alt=""
                    />
                </div>
            ) : null}
        </div>
    );
}
