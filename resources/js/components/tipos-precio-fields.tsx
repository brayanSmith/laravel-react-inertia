import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TIPOS_PRECIO } from '@/lib/tipos-precio';

type Props = {
    selected: string[];
    onChange: (selected: string[]) => void;
    error?: string;
};

/** Which product prices a user may see and use, plus the hidden inputs the form submits. */
export default function TiposPrecioFields({
    selected,
    onChange,
    error,
}: Props) {
    const toggle = (value: string, checked: boolean) => {
        onChange(
            checked
                ? [...selected, value]
                : selected.filter((item) => item !== value),
        );
    };

    return (
        <div className="grid gap-2">
            <Label>Precios permitidos</Label>
            <div className="flex flex-wrap gap-3">
                {TIPOS_PRECIO.map((tipo) => (
                    <label
                        key={tipo.value}
                        className="flex items-center gap-2 text-sm"
                    >
                        <Checkbox
                            checked={selected.includes(tipo.value)}
                            onCheckedChange={(checked) =>
                                toggle(tipo.value, checked === true)
                            }
                            data-test={`tipo-precio-${tipo.value}`}
                        />
                        {tipo.label}
                    </label>
                ))}
            </div>
            {selected.map((value) => (
                <input
                    key={value}
                    type="hidden"
                    name="tipos_precio_permitidos[]"
                    value={value}
                />
            ))}
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
    );
}
