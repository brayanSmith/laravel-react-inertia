import { Calendar, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type DateRangeValue = {
    from: string;
    to: string;
};

type Props = {
    value: DateRangeValue;
    onChange: (value: DateRangeValue) => void;
    title?: string;
    placeholder?: string;
    dataTest?: string;
};

function formatDate(value: string): string {
    if (!value) {
        return '';
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * A small "opens a modal to pick a from/to date" filter control, meant to
 * live inside a table header cell (hence the compact trigger button).
 */
export default function DateRangeFilter({
    value,
    onChange,
    title = 'Rango de fecha',
    placeholder = 'Filtrar por fecha',
    dataTest,
}: Props) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<DateRangeValue>(value);

    useEffect(() => {
        if (open) {
            setDraft(value);
        }
    }, [open, value]);

    const hasValue = Boolean(value.from || value.to);
    const summary = hasValue
        ? `${formatDate(value.from) || '…'} – ${formatDate(value.to) || '…'}`
        : placeholder;

    const handleApply = () => {
        onChange(draft);
        setOpen(false);
    };

    const handleClear = () => {
        setDraft({ from: '', to: '' });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-test={dataTest}
                    className={cn(
                        'h-8 w-full justify-start gap-1.5 px-2 text-xs font-normal',
                        !hasValue && 'text-muted-foreground',
                    )}
                >
                    <Calendar className="size-3.5 shrink-0" />
                    <span className="truncate">{summary}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Selecciona el rango de fechas a filtrar.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date-range-from">Desde</Label>
                        <Input
                            id="date-range-from"
                            type="date"
                            value={draft.from}
                            max={draft.to || undefined}
                            onChange={(event) =>
                                setDraft((prev) => ({
                                    ...prev,
                                    from: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="date-range-to">Hasta</Label>
                        <Input
                            id="date-range-to"
                            type="date"
                            value={draft.to}
                            min={draft.from || undefined}
                            onChange={(event) =>
                                setDraft((prev) => ({
                                    ...prev,
                                    to: event.target.value,
                                }))
                            }
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button type="button" variant="ghost" onClick={handleClear}>
                        <X className="size-4" />
                        Limpiar
                    </Button>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="button" onClick={handleApply}>
                            Aplicar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
