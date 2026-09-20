import type { ClienteOption } from '@/types';

type Props = {
    cliente: ClienteOption;
};

function Dato({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="min-w-0">
            <span className="text-muted-foreground">{label}: </span>
            <span className="break-words">{value || '—'}</span>
        </div>
    );
}

/** The selected cliente's data, shown under the "Seleccionar cliente" button. */
export default function PosClienteCard({ cliente }: Props) {
    return (
        <div
            className="bg-muted/40 grid gap-1 rounded-md border p-3 text-sm"
            data-test="pos-cliente-card"
        >
            <p className="font-semibold">{cliente.razon_social}</p>
            <Dato label="Documento" value={cliente.numero_documento} />
            <Dato label="Teléfono" value={cliente.telefono} />
            <Dato label="Ciudad" value={cliente.ciudad} />
            <Dato label="Dirección" value={cliente.direccion} />
            <Dato label="Email" value={cliente.email} />
        </div>
    );
}
