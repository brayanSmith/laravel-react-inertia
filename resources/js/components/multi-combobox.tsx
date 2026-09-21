import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type MultiComboboxOption = {
    value: string;
    label: string;
};

type Props = {
    options: MultiComboboxOption[];
    /** Applied values; an empty list means "all". Only changes on Aceptar. */
    value: string[];
    onValueChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    dataTest?: string;
    className?: string;
};

/** Rendering thousands of rows at once is slow; the search narrows them down. */
const MAX_VISIBLE = 100;

export default function MultiCombobox({
    options,
    value,
    onValueChange,
    placeholder = 'Todos',
    searchPlaceholder = 'Buscar...',
    emptyText = 'No se encontraron resultados.',
    dataTest,
    className,
}: Props) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    // Picks are kept here until the user confirms them.
    const [borrador, setBorrador] = useState<string[]>(value);

    const coincidentes = useMemo(() => {
        const term = search.trim().toLowerCase();

        return term
            ? options.filter((option) =>
                  option.label.toLowerCase().includes(term),
              )
            : options;
    }, [options, search]);

    const visibles = useMemo(
        () => coincidentes.slice(0, MAX_VISIBLE),
        [coincidentes],
    );

    const todosMarcados =
        coincidentes.length > 0 &&
        coincidentes.every((option) => borrador.includes(option.value));

    // Selects every option matching the search (not only the rendered ones).
    const seleccionarTodo = () =>
        setBorrador((prev) => [
            ...new Set([
                ...prev,
                ...coincidentes.map((option) => option.value),
            ]),
        ]);

    const labelFor = (selected: string) =>
        options.find((option) => option.value === selected)?.label ?? selected;

    const summary =
        value.length === 0
            ? placeholder
            : value.length === 1
              ? labelFor(value[0])
              : `${value.length} seleccionados`;

    const toggle = (selected: string) =>
        setBorrador((prev) =>
            prev.includes(selected)
                ? prev.filter((item) => item !== selected)
                : [...prev, selected],
        );

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        setSearch('');

        if (next) {
            setBorrador(value);
        }
    };

    const aceptar = () => {
        setOpen(false);
        setSearch('');

        const changed =
            borrador.length !== value.length ||
            borrador.some((item) => !value.includes(item));

        if (changed) {
            onValueChange(borrador);
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger
                data-test={dataTest}
                className={cn(
                    'border-input bg-background hover:bg-accent flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm shadow-xs',
                    value.length === 0 && 'text-muted-foreground',
                    className,
                )}
            >
                <span className="truncate">{summary}</span>
                <ChevronDown className="size-4 shrink-0 opacity-50" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-72 p-0"
            >
                <div className="flex items-center gap-2 border-b px-3">
                    <Search className="size-4 shrink-0 opacity-50" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        // Keep the menu's type-ahead from stealing the keys.
                        onKeyDown={(event) => event.stopPropagation()}
                        placeholder={searchPlaceholder}
                        className="h-9 w-full bg-transparent text-sm outline-none"
                    />
                </div>

                <div className="max-h-64 overflow-y-auto p-1">
                    {visibles.length === 0 ? (
                        <p className="text-muted-foreground px-2 py-4 text-center text-sm">
                            {emptyText}
                        </p>
                    ) : (
                        visibles.map((option) => (
                            <DropdownMenuCheckboxItem
                                key={option.value}
                                checked={borrador.includes(option.value)}
                                onSelect={(event) => event.preventDefault()}
                                onCheckedChange={() => toggle(option.value)}
                            >
                                {option.label}
                            </DropdownMenuCheckboxItem>
                        ))
                    )}
                </div>

                <DropdownMenuSeparator className="my-0" />
                <div className="flex items-center justify-between gap-2 p-2">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={seleccionarTodo}
                            disabled={todosMarcados}
                            className="text-primary hover:underline text-sm disabled:opacity-50"
                        >
                            Seleccionar todo
                        </button>
                        <button
                            type="button"
                            onClick={() => setBorrador([])}
                            disabled={borrador.length === 0}
                            className="text-muted-foreground hover:text-foreground text-sm disabled:opacity-50"
                        >
                            Quitar selección
                        </button>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={aceptar}
                        data-test={dataTest ? `${dataTest}-aceptar` : undefined}
                    >
                        Aceptar
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
