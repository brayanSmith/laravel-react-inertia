import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { TIPOS_PRECIO } from '@/lib/tipos-precio';
import { update } from '@/routes/usuarios/precios';

type Props = {
    usuarioId: number;
    selected: string[];
    canEdit: boolean;
};

/**
 * The prices a user may see and use, as badges. With permission, clicking one
 * turns it on or off right from the table (at least one always stays on).
 */
export default function TiposPrecioBadges({
    usuarioId,
    selected,
    canEdit,
}: Props) {
    const toggle = (value: string) => {
        const active = selected.includes(value);

        if (active && selected.length === 1) {
            return;
        }

        router.visit(update(usuarioId), {
            data: {
                tipos_precio_permitidos: active
                    ? selected.filter((item) => item !== value)
                    : [...selected, value],
            },
            preserveScroll: true,
        });
    };

    return (
        <div className="flex flex-wrap gap-2">
            {TIPOS_PRECIO.map((tipo) => {
                const active = selected.includes(tipo.value);

                return (
                    <Badge
                        key={tipo.value}
                        data-test={`precio-toggle-${tipo.value}`}
                        variant={active ? 'default' : 'outline'}
                        className={canEdit ? 'cursor-pointer' : undefined}
                        onClick={canEdit ? () => toggle(tipo.value) : undefined}
                    >
                        {tipo.label}
                    </Badge>
                );
            })}
        </div>
    );
}
