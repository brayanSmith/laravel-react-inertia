import { Check, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import CreateClienteModal from '@/components/create-cliente-modal';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ClienteOption } from '@/types';

type Props = {
    clientes: ClienteOption[];
    selectedId: string;
    /** Whether the user may register a new cliente from here. */
    canCreate: boolean;
    onSelect: (clienteId: string) => void;
    onClose: () => void;
};

const PAGE_SIZE = 10;

function searchText(cliente: ClienteOption): string {
    return [
        cliente.razon_social,
        cliente.numero_documento,
        cliente.telefono,
        cliente.ciudad,
        cliente.direccion,
        cliente.email,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

/**
 * Cliente picker for the POS: searchable list of clientes with their data,
 * and a "Nuevo cliente" shortcut so nobody has to leave the POS to register
 * one. A cliente created here is selected automatically once it shows up in
 * the refreshed list.
 */
export default function PosClienteModal({
    clientes,
    selectedId,
    canCreate,
    onSelect,
    onClose,
}: Props) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    // Clientes present when the modal opened; anything else is one created
    // from here. Inertia may commit the refreshed list before or after the
    // create form's success callback, so both paths run the same check.
    const baselineIds = useRef(new Set(clientes.map((cliente) => cliente.id)));
    const latestClientes = useRef(clientes);
    const awaitingNew = useRef(false);

    latestClientes.current = clientes;

    const selectNewCliente = () => {
        if (!awaitingNew.current) {
            return;
        }

        const nuevo = latestClientes.current
            .filter((cliente) => !baselineIds.current.has(cliente.id))
            .sort((a, b) => b.id - a.id)[0];

        if (nuevo) {
            awaitingNew.current = false;
            baselineIds.current.add(nuevo.id);
            onSelect(String(nuevo.id));
        }
    };

    useEffect(selectNewCliente, [clientes]);

    const filtrados = useMemo(() => {
        const term = search.trim().toLowerCase();

        return term
            ? clientes.filter((cliente) => searchText(cliente).includes(term))
            : clientes;
    }, [clientes, search]);

    // Only 10 clientes are rendered at a time, so a long list doesn't slow
    // the modal down; the search still looks through all of them.
    const totalPages = Math.max(Math.ceil(filtrados.length / PAGE_SIZE), 1);
    const currentPage = Math.min(page, totalPages);
    const visibles = filtrados.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="flex max-h-[85vh] flex-col sm:max-w-2xl"
                data-test="pos-cliente-modal"
            >
                <DialogHeader>
                    <DialogTitle>Seleccionar cliente</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Buscar por nombre, documento, teléfono, ciudad..."
                            className="pl-9"
                            autoFocus
                            data-test="pos-cliente-search"
                        />
                    </div>

                    {canCreate ? (
                        <CreateClienteModal
                            fromPos
                            onCreated={() => {
                                awaitingNew.current = true;
                                selectNewCliente();
                            }}
                        >
                            <Button
                                type="button"
                                variant="outline"
                                title="Nuevo cliente"
                                aria-label="Nuevo cliente"
                                data-test="pos-cliente-nuevo"
                            >
                                <Plus />
                                <span className="hidden md:inline">
                                    Nuevo cliente
                                </span>
                            </Button>
                        </CreateClienteModal>
                    ) : null}
                </div>

                <div className="-mr-2 grid gap-2 overflow-y-auto pr-2">
                    {filtrados.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                            No se encontraron clientes.
                        </p>
                    ) : (
                        visibles.map((cliente) => {
                            const selected = String(cliente.id) === selectedId;

                            return (
                                <button
                                    key={cliente.id}
                                    type="button"
                                    onClick={() => onSelect(String(cliente.id))}
                                    data-test="pos-cliente-option"
                                    className={cn(
                                        'hover:bg-accent grid gap-0.5 rounded-md border p-3 text-left text-sm',
                                        selected &&
                                            'border-primary bg-primary/5',
                                    )}
                                >
                                    <span className="flex items-center justify-between gap-2 font-semibold">
                                        {cliente.razon_social}
                                        {selected ? (
                                            <Check className="text-primary size-4" />
                                        ) : null}
                                    </span>
                                    <span className="text-muted-foreground grid gap-x-4 sm:grid-cols-2">
                                        <span>
                                            Documento:{' '}
                                            {cliente.numero_documento ?? '—'}
                                        </span>
                                        <span>
                                            Teléfono: {cliente.telefono ?? '—'}
                                        </span>
                                        <span>
                                            Ciudad: {cliente.ciudad ?? '—'}
                                        </span>
                                        <span>
                                            Email: {cliente.email ?? '—'}
                                        </span>
                                        <span className="sm:col-span-2">
                                            Dirección:{' '}
                                            {cliente.direccion ?? '—'}
                                        </span>
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
                {filtrados.length > PAGE_SIZE ? (
                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        dataTest="pos-cliente-page"
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
