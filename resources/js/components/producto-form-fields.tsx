import { useMemo, useState } from 'react';
import Combobox from '@/components/combobox';
import InputError from '@/components/input-error';
import ProductoImageUpload from '@/components/producto-image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
    CategoriaProducto,
    MarcaOption,
    Producto,
    TipoProducto,
    TipoVehiculo,
} from '@/types';

type FormErrors = Partial<Record<string, string>>;

type Props = {
    producto?: Producto | null;
    marcas: MarcaOption[];
    errors: FormErrors;
    onImageChange: (file: File | null, removed: boolean) => void;
};

const CATEGORIAS: { value: CategoriaProducto; label: string }[] = [
    { value: 'LLANTA', label: 'Llantas' },
    { value: 'RIN', label: 'Rines' },
    { value: 'SERVICIO', label: 'Servicios' },
    { value: 'OTRO', label: 'Otros' },
];

const TIPOS: { value: TipoProducto; label: string }[] = [
    { value: 'NUEVO', label: 'Nuevo' },
    { value: 'USADO', label: 'Usado' },
    { value: 'SERVICIO', label: 'Servicio' },
];

export default function ProductoFormFields({
    producto,
    marcas,
    errors,
    onImageChange,
}: Props) {
    const [categoria, setCategoria] = useState<CategoriaProducto>(
        producto?.categoria ?? 'LLANTA',
    );
    const [tipo, setTipo] = useState<TipoProducto>(
        (producto?.categoria ?? 'LLANTA') === 'SERVICIO'
            ? 'SERVICIO'
            : producto?.tipo && producto.tipo !== 'SERVICIO'
              ? producto.tipo
              : 'NUEVO',
    );
    const [inventariable, setInventariable] = useState(
        producto?.inventariable ?? true,
    );
    const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo>(
        producto?.tipo_vehiculo ?? 'CARRO',
    );
    const [marcaId, setMarcaId] = useState<string>(
        producto?.marca_id ? String(producto.marca_id) : '',
    );
    const marcaOptions = useMemo(
        () =>
            marcas.map((marca) => ({
                value: String(marca.id),
                label: marca.marca,
            })),
        [marcas],
    );
    const [ancho, setAncho] = useState(producto?.ancho ?? '');
    const [perfil, setPerfil] = useState(producto?.perfil ?? '');
    const [construccion, setConstruccion] = useState(
        producto?.construccion ?? '',
    );
    const [rin, setRin] = useState(producto?.rin ?? '');
    const [referencia, setReferencia] = useState(
        producto?.referencia_producto ?? '',
    );
    const [descripcionProducto, setDescripcionProducto] = useState(
        producto?.descripcion_producto ?? '',
    );
    const [concatenacion, setConcatenacion] = useState(
        producto?.concatenar_codigo_nombre ?? '',
    );

    const updateConcatenacion = (
        next: Partial<{
            referencia: string;
            marcaId: string;
            descripcionProducto: string;
        }>,
    ) => {
        const values = {
            referencia,
            marcaId,
            descripcionProducto,
            ...next,
        };

        const marcaNombre = marcas.find(
            (marca) => String(marca.id) === values.marcaId,
        )?.marca;

        setConcatenacion(
            [values.referencia, marcaNombre, values.descripcionProducto]
                .filter(Boolean)
                .join('-'),
        );
    };

    const updateReferencia = (
        next: Partial<{
            ancho: string;
            perfil: string;
            construccion: string;
            rin: string;
        }>,
    ) => {
        const values = {
            ancho,
            perfil,
            construccion,
            rin,
            ...next,
        };

        const nextReferencia = `${values.ancho}${values.perfil ? `/${values.perfil}` : ''}${values.construccion}${values.rin}`;

        setReferencia(nextReferencia);
        updateConcatenacion({ referencia: nextReferencia });
    };

    const updateReferenciaRin = (
        next: Partial<{ rin: string; ancho: string }>,
    ) => {
        const values = { rin, ancho, ...next };

        const nextReferencia =
            values.rin && values.ancho
                ? `${values.rin}X${values.ancho}`
                : values.rin || values.ancho || '';

        setReferencia(nextReferencia);
        updateConcatenacion({ referencia: nextReferencia });
    };

    const handleCategoriaChange = (value: CategoriaProducto) => {
        setCategoria(value);
        setAncho('');
        setPerfil('');
        setConstruccion('');
        setRin('');
        setTipoVehiculo('CARRO');
        setMarcaId('');
        setDescripcionProducto('');
        setReferencia('');
        setConcatenacion('');

        // Servicio is the only tipo allowed for the SERVICIO category, and
        // any other category cannot use it.
        if (value === 'SERVICIO') {
            setInventariable(false);
            setTipo('SERVICIO');
        } else if (tipo === 'SERVICIO') {
            setTipo('NUEVO');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-card flex flex-wrap items-center gap-8 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <Label className="font-semibold">Categoría</Label>
                    <RadioGroup
                        value={categoria}
                        onValueChange={(value) =>
                            handleCategoriaChange(value as CategoriaProducto)
                        }
                        className="flex flex-wrap gap-4"
                    >
                        {CATEGORIAS.map((c) => (
                            <label
                                key={c.value}
                                className="flex items-center gap-2 text-sm"
                            >
                                <RadioGroupItem value={c.value} />
                                {c.label}
                            </label>
                        ))}
                    </RadioGroup>
                    <input type="hidden" name="categoria" value={categoria} />
                    <InputError message={errors.categoria} />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <Label className="font-semibold">Tipo</Label>
                    <RadioGroup
                        value={tipo}
                        onValueChange={(value) =>
                            setTipo(value as TipoProducto)
                        }
                        className="flex flex-wrap gap-4"
                    >
                        {TIPOS.map((t) => (
                            <label
                                key={t.value}
                                className="flex items-center gap-2 text-sm"
                            >
                                <RadioGroupItem
                                    value={t.value}
                                    disabled={
                                        (t.value === 'SERVICIO') !==
                                        (categoria === 'SERVICIO')
                                    }
                                />
                                {t.label}
                            </label>
                        ))}
                    </RadioGroup>
                    <input type="hidden" name="tipo" value={tipo} />
                    <InputError message={errors.tipo} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Label className="font-semibold">Inventariable</Label>
                    <Switch
                        checked={inventariable}
                        onCheckedChange={setInventariable}
                        data-test="producto-inventariable"
                    />
                    <span className="text-sm">
                        {inventariable ? 'Sí' : 'No'}
                    </span>
                    <input
                        type="hidden"
                        name="inventariable"
                        value={inventariable ? '1' : '0'}
                    />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="bg-card space-y-4 rounded-lg border p-4 lg:col-span-2">
                    <div className="font-semibold">
                        Atributos de la Categoría
                    </div>

                    {categoria === 'LLANTA' ? (
                        <div className="grid gap-4 sm:grid-cols-4">
                            <div className="grid gap-2">
                                <Label htmlFor="ancho">Ancho</Label>
                                <Input
                                    id="ancho"
                                    name="ancho"
                                    data-test="producto-ancho"
                                    value={ancho}
                                    onChange={(event) => {
                                        setAncho(event.target.value);
                                        updateReferencia({
                                            ancho: event.target.value,
                                        });
                                    }}
                                />
                                <InputError message={errors.ancho} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="perfil">Perfil</Label>
                                <Input
                                    id="perfil"
                                    name="perfil"
                                    value={perfil}
                                    onChange={(event) => {
                                        setPerfil(event.target.value);
                                        updateReferencia({
                                            perfil: event.target.value,
                                        });
                                    }}
                                />
                                <InputError message={errors.perfil} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="construccion">
                                    Construcción
                                </Label>
                                <Input
                                    id="construccion"
                                    name="construccion"
                                    value={construccion}
                                    onChange={(event) => {
                                        setConstruccion(event.target.value);
                                        updateReferencia({
                                            construccion: event.target.value,
                                        });
                                    }}
                                />
                                <InputError message={errors.construccion} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="rin">Rin</Label>
                                <Input
                                    id="rin"
                                    name="rin"
                                    data-test="producto-rin"
                                    value={rin}
                                    onChange={(event) => {
                                        setRin(event.target.value);
                                        updateReferencia({
                                            rin: event.target.value,
                                        });
                                    }}
                                />
                                <InputError message={errors.rin} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tipo de Vehículo</Label>
                                <Select
                                    value={tipoVehiculo}
                                    onValueChange={(value) =>
                                        setTipoVehiculo(value as TipoVehiculo)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CARRO">
                                            Carro
                                        </SelectItem>
                                        <SelectItem value="MOTO">
                                            Moto
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <input
                                    type="hidden"
                                    name="tipo_vehiculo"
                                    value={tipoVehiculo}
                                />
                                <InputError message={errors.tipo_vehiculo} />
                            </div>
                        </div>
                    ) : null}

                    {categoria === 'RIN' ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="rin">Rin</Label>
                                    <Input
                                        id="rin"
                                        name="rin"
                                        data-test="producto-rin"
                                        value={rin}
                                        onChange={(event) => {
                                            setRin(event.target.value);
                                            updateReferenciaRin({
                                                rin: event.target.value,
                                            });
                                        }}
                                    />
                                    <InputError message={errors.rin} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="ancho">Ancho</Label>
                                    <Input
                                        id="ancho"
                                        name="ancho"
                                        data-test="producto-ancho"
                                        value={ancho}
                                        onChange={(event) => {
                                            setAncho(event.target.value);
                                            updateReferenciaRin({
                                                ancho: event.target.value,
                                            });
                                        }}
                                    />
                                    <InputError message={errors.ancho} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="referencia_producto">
                                        Referencia
                                    </Label>
                                    <Input
                                        id="referencia_producto"
                                        name="referencia_producto"
                                        data-test="producto-referencia"
                                        value={referencia}
                                        onChange={(event) => {
                                            setReferencia(event.target.value);
                                            updateConcatenacion({
                                                referencia: event.target.value,
                                            });
                                        }}
                                    />
                                    <InputError
                                        message={errors.referencia_producto}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Marca</Label>
                                    <Combobox
                                        options={marcaOptions}
                                        value={marcaId}
                                        onValueChange={(value) => {
                                            setMarcaId(value);
                                            updateConcatenacion({
                                                marcaId: value,
                                            });
                                        }}
                                        placeholder="Sin marca"
                                        searchPlaceholder="Buscar marca..."
                                        emptyText="No se encontraron marcas."
                                        dataTest="producto-marca"
                                    />
                                    <input
                                        type="hidden"
                                        name="marca_id"
                                        value={marcaId}
                                    />
                                    <InputError message={errors.marca_id} />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="descripcion_producto">
                                        Descripción
                                    </Label>
                                    <Input
                                        id="descripcion_producto"
                                        name="descripcion_producto"
                                        data-test="producto-descripcion"
                                        value={descripcionProducto}
                                        onChange={(event) => {
                                            setDescripcionProducto(
                                                event.target.value,
                                            );
                                            updateConcatenacion({
                                                descripcionProducto:
                                                    event.target.value,
                                            });
                                        }}
                                    />
                                    <InputError
                                        message={errors.descripcion_producto}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="concatenar_codigo_nombre">
                                        Concatenación
                                    </Label>
                                    <Input
                                        id="concatenar_codigo_nombre"
                                        data-test="producto-concatenacion"
                                        value={concatenacion}
                                        disabled
                                        readOnly
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="sku">SKU</Label>
                                    <Input
                                        id="sku"
                                        name="sku"
                                        data-test="producto-sku"
                                        defaultValue={producto?.sku ?? ''}
                                    />
                                    <InputError message={errors.sku} />
                                </div>
                            </div>
                        </>
                    ) : null}

                    {categoria === 'SERVICIO' ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="descripcion_producto">
                                        Descripción
                                    </Label>
                                    <Input
                                        id="descripcion_producto"
                                        name="descripcion_producto"
                                        data-test="producto-descripcion"
                                        value={descripcionProducto}
                                        onChange={(event) => {
                                            setDescripcionProducto(
                                                event.target.value,
                                            );
                                            updateConcatenacion({
                                                descripcionProducto:
                                                    event.target.value,
                                            });
                                        }}
                                    />
                                    <InputError
                                        message={errors.descripcion_producto}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="concatenar_codigo_nombre">
                                        Concatenación
                                    </Label>
                                    <Input
                                        id="concatenar_codigo_nombre"
                                        data-test="producto-concatenacion"
                                        value={concatenacion}
                                        disabled
                                        readOnly
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="sku">SKU</Label>
                                    <Input
                                        id="sku"
                                        name="sku"
                                        data-test="producto-sku"
                                        defaultValue={producto?.sku ?? ''}
                                    />
                                    <InputError message={errors.sku} />
                                </div>
                            </div>
                        </>
                    ) : null}

                    {categoria === 'LLANTA' || categoria === 'OTRO' ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="referencia_producto">
                                        Referencia
                                    </Label>
                                    <Input
                                        id="referencia_producto"
                                        name="referencia_producto"
                                        data-test="producto-referencia"
                                        value={referencia}
                                        onChange={(event) => {
                                            setReferencia(event.target.value);
                                            updateConcatenacion({
                                                referencia: event.target.value,
                                            });
                                        }}
                                    />
                                    <InputError
                                        message={errors.referencia_producto}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Marca</Label>
                                    <Combobox
                                        options={marcaOptions}
                                        value={marcaId}
                                        onValueChange={(value) => {
                                            setMarcaId(value);
                                            updateConcatenacion({
                                                marcaId: value,
                                            });
                                        }}
                                        placeholder="Sin marca"
                                        searchPlaceholder="Buscar marca..."
                                        emptyText="No se encontraron marcas."
                                        dataTest="producto-marca"
                                    />
                                    <input
                                        type="hidden"
                                        name="marca_id"
                                        value={marcaId}
                                    />
                                    <InputError message={errors.marca_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="descripcion_producto">
                                        Descripción
                                    </Label>
                                    <Input
                                        id="descripcion_producto"
                                        name="descripcion_producto"
                                        data-test="producto-descripcion"
                                        value={descripcionProducto}
                                        onChange={(event) => {
                                            setDescripcionProducto(
                                                event.target.value,
                                            );
                                            updateConcatenacion({
                                                descripcionProducto:
                                                    event.target.value,
                                            });
                                        }}
                                    />
                                    <InputError
                                        message={errors.descripcion_producto}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="concatenar_codigo_nombre">
                                        Concatenación
                                    </Label>
                                    <Input
                                        id="concatenar_codigo_nombre"
                                        data-test="producto-concatenacion"
                                        value={concatenacion}
                                        disabled
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="sku">SKU</Label>
                                    <Input
                                        id="sku"
                                        name="sku"
                                        data-test="producto-sku"
                                        defaultValue={producto?.sku ?? ''}
                                    />
                                    <InputError message={errors.sku} />
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                <div className="bg-card space-y-3 rounded-lg border p-4">
                    <div className="font-semibold">Imagen del Producto</div>
                    <ProductoImageUpload
                        value={producto?.imagen_producto_url}
                        onChange={onImageChange}
                        error={errors.imagen_producto}
                    />
                </div>
            </div>

            <div className="bg-card space-y-4 rounded-lg border p-4">
                <div className="font-semibold">Precios y Porcentajes</div>
                <div className="grid gap-4 sm:grid-cols-4">
                    <div className="grid gap-2">
                        <Label htmlFor="costo_producto">Costo</Label>
                        <Input
                            id="costo_producto"
                            name="costo_producto"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={producto?.costo_producto ?? '0'}
                        />
                        <InputError message={errors.costo_producto} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="valor_detal">Valor Detal</Label>
                        <Input
                            id="valor_detal"
                            name="valor_detal"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={producto?.valor_detal ?? '0'}
                        />
                        <InputError message={errors.valor_detal} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="valor_mayorista">Valor Mayorista</Label>
                        <Input
                            id="valor_mayorista"
                            name="valor_mayorista"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={producto?.valor_mayorista ?? '0'}
                        />
                        <InputError message={errors.valor_mayorista} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="valor_sin_instalacion">
                            Valor Sin Instalación
                        </Label>
                        <Input
                            id="valor_sin_instalacion"
                            name="valor_sin_instalacion"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={
                                producto?.valor_sin_instalacion ?? '0'
                            }
                        />
                        <InputError message={errors.valor_sin_instalacion} />
                    </div>
                </div>
            </div>
        </div>
    );
}
