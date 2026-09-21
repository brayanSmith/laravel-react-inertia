import { Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Preset = { label: string; value: string | null };

type Props = {
    presets: Preset[];
    /** What the swatch of the original (null) option looks like. */
    originalSwatch: string;
    stored: string | null;
    onChange: (value: string | null) => void;
    dataTest: string;
};

/** A row of color swatches plus a free color input; the choice is saved by `onChange`. */
export default function ColorPicker({
    presets,
    originalSwatch,
    stored,
    onChange,
    dataTest,
}: Props) {
    const [color, setColor] = useState<string | null>(stored);

    const choose = (value: string | null) => {
        setColor(value);
        onChange(value);
    };

    return (
        <div className="space-y-3" data-test={dataTest}>
            <div className="flex flex-wrap items-center gap-3">
                {presets.map((preset) => {
                    const active = preset.value === color;
                    const swatch = preset.value ?? originalSwatch;

                    return (
                        <button
                            key={preset.label}
                            type="button"
                            title={preset.label}
                            aria-label={preset.label}
                            aria-pressed={active}
                            onClick={() => choose(preset.value)}
                            data-test={`${dataTest}-${preset.value ?? 'original'}`}
                            className={cn(
                                'flex size-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110',
                                active ? 'border-foreground' : 'border-border',
                            )}
                            style={{ backgroundColor: swatch }}
                        >
                            {active ? (
                                <Check
                                    className="size-4"
                                    style={{
                                        color:
                                            swatch === '#ffffff'
                                                ? '#111111'
                                                : '#ffffff',
                                    }}
                                />
                            ) : null}
                        </button>
                    );
                })}

                <label
                    className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm"
                    title="Elegir otro color"
                >
                    <input
                        type="color"
                        value={color ?? originalSwatch}
                        onChange={(event) => choose(event.target.value)}
                        data-test={`${dataTest}-custom`}
                        className="size-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
                    />
                    Personalizado
                </label>
            </div>
        </div>
    );
}
