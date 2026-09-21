import { router, usePage } from '@inertiajs/react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Props = {
    /** Whether the deleted records are being shown. */
    eliminados: boolean;
    /** Only offered to whoever may delete (and so restore) records. */
    visible: boolean;
};

/**
 * "Activos / Eliminados" switch for the modules whose records are soft
 * deleted. It reloads the same page with `?eliminados=1`, so the server
 * only sends the deleted records when they are asked for.
 */
export default function TrashToggle({ eliminados, visible }: Props) {
    const { url } = usePage();

    if (!visible) {
        return null;
    }

    const cambiar = (value: string) => {
        if (!value || (value === 'eliminados') === eliminados) {
            return;
        }

        const path = url.split('?')[0];

        router.get(path, value === 'eliminados' ? { eliminados: 1 } : {}, {
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <ToggleGroup
            type="single"
            variant="outline"
            value={eliminados ? 'eliminados' : 'activos'}
            onValueChange={cambiar}
            data-test="trash-toggle"
        >
            <ToggleGroupItem
                value="activos"
                data-test="trash-toggle-activos"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
            >
                Activos
            </ToggleGroupItem>
            <ToggleGroupItem
                value="eliminados"
                data-test="trash-toggle-eliminados"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90"
            >
                Eliminados
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
