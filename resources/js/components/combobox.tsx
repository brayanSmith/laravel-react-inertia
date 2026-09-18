import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type ComboboxOption = {
    value: string;
    label: string;
};

type Props = {
    options: ComboboxOption[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    dataTest?: string;
    /** Only show the search box once there are more than this many options. */
    searchThreshold?: number;
    className?: string;
};

type Position = {
    mode: 'fixed' | 'absolute';
    top: number;
    left: number;
    width: number;
};

export default function Combobox({
    options,
    value,
    onValueChange,
    placeholder = 'Seleccione...',
    searchPlaceholder = 'Buscar...',
    emptyText = 'No se encontraron resultados.',
    dataTest,
    searchThreshold = 10,
    className,
}: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [position, setPosition] = useState<Position | null>(null);
    const [portalTarget, setPortalTarget] = useState<Element | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const showSearch = options.length > searchThreshold;

    const selected = useMemo(
        () => options.find((option) => option.value === value),
        [options, value],
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term || !showSearch) {
            return options;
        }

        return options.filter((option) =>
            option.label.toLowerCase().includes(term),
        );
    }, [options, search, showSearch]);

    /**
     * Radix's Dialog traps focus to its own content subtree while open,
     * forcibly reverting focus (and breaking clicks) on anything portaled
     * elsewhere. Portal inside the dialog's own content node when present so
     * the trap recognizes it as "inside" instead of fighting it.
     */
    const getDialogAncestor = (): Element | null =>
        triggerRef.current?.closest('[data-slot="dialog-content"]') ?? null;

    const updatePosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();

        if (!rect) {
            return;
        }

        const dialogEl = getDialogAncestor();

        if (dialogEl) {
            const dialogRect = dialogEl.getBoundingClientRect();

            setPosition({
                mode: 'absolute',
                top: rect.bottom - dialogRect.top + 4,
                left: rect.left - dialogRect.left,
                width: rect.width,
            });
        } else {
            setPosition({
                mode: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        setPortalTarget(getDialogAncestor() ?? document.body);
        updatePosition();
        setSearch('');

        if (showSearch) {
            requestAnimationFrame(() => searchInputRef.current?.focus());
        }

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                triggerRef.current?.contains(target) ||
                panelRef.current?.contains(target)
            ) {
                return;
            }

            setOpen(false);
        };

        const handleReposition = () => updatePosition();

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleReposition, true);
        window.addEventListener('resize', handleReposition);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleReposition, true);
            window.removeEventListener('resize', handleReposition);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, showSearch]);

    const handleSelect = (option: ComboboxOption) => {
        onValueChange(option.value);
        setOpen(false);
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                data-test={dataTest}
                onClick={() => setOpen((prev) => !prev)}
                className={cn(
                    'border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]',
                    className,
                )}
            >
                <span
                    className={cn(
                        'line-clamp-1 text-left',
                        !selected && 'text-muted-foreground',
                    )}
                >
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-50" />
            </button>

            {open && position && portalTarget
                ? createPortal(
                      <div
                          ref={panelRef}
                          data-combobox-portal=""
                          style={{
                              position: position.mode,
                              top: position.top,
                              left: position.left,
                              width: Math.max(position.width, 256),
                          }}
                          className="bg-popover text-popover-foreground z-50 overflow-hidden rounded-md border shadow-md"
                      >
                          {showSearch ? (
                              <div className="flex items-center gap-2 border-b px-3 py-2">
                                  <Search className="text-muted-foreground size-4 shrink-0" />
                                  <input
                                      ref={searchInputRef}
                                      type="text"
                                      value={search}
                                      onChange={(event) =>
                                          setSearch(event.target.value)
                                      }
                                      onKeyDown={(event) => {
                                          if (event.key === 'Escape') {
                                              setOpen(false);
                                          } else if (
                                              event.key === 'Enter' &&
                                              filtered.length > 0
                                          ) {
                                              event.preventDefault();
                                              handleSelect(filtered[0]);
                                          }
                                      }}
                                      placeholder={searchPlaceholder}
                                      className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
                                  />
                              </div>
                          ) : null}

                          <div className="max-h-64 overflow-y-auto p-1">
                              {filtered.length === 0 ? (
                                  <p className="text-muted-foreground px-2 py-4 text-center text-sm">
                                      {emptyText}
                                  </p>
                              ) : (
                                  filtered.map((option) => (
                                      <button
                                          type="button"
                                          key={option.value}
                                          onClick={() =>
                                              handleSelect(option)
                                          }
                                          className={cn(
                                              'hover:bg-accent hover:text-accent-foreground flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm select-none',
                                              option.value === value &&
                                                  'bg-accent text-accent-foreground',
                                          )}
                                      >
                                          {option.label}
                                      </button>
                                  ))
                              )}
                          </div>
                      </div>,
                      portalTarget,
                  )
                : null}
        </>
    );
}
