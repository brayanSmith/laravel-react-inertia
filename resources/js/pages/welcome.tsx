import { Head, Link, usePage } from '@inertiajs/react';
import { CircleGauge, Disc3, Settings2, Wrench } from 'lucide-react';
import { dashboard, login } from '@/routes';

const SERVICIOS = [
    { icon: Disc3, label: 'Llantas y rines para carro y moto' },
    { icon: Settings2, label: 'Montaje, balanceo y alineación' },
    { icon: CircleGauge, label: 'Rotación y nitrógeno' },
    { icon: Wrench, label: 'Reparación de llantas y válvulas' },
];

export default function Welcome() {
    const { auth, name, logoUrl } = usePage().props;

    return (
        <>
            <Head title="Bienvenido" />
            <div className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
                <div className="bg-card grid w-full max-w-4xl overflow-hidden rounded-xl border shadow-sm md:grid-cols-2">
                    <div className="flex flex-col justify-center gap-6 p-8 md:p-12">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold">
                                Bienvenido a {name}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Somos una llantería: todo para que tu vehículo
                                ruede seguro. Ingresa para gestionar pedidos,
                                inventario y ventas.
                            </p>
                        </div>

                        <ul className="space-y-3 text-sm">
                            {SERVICIOS.map((servicio) => (
                                <li
                                    key={servicio.label}
                                    className="flex items-center gap-3"
                                >
                                    <span className="bg-muted flex size-8 items-center justify-center rounded-full">
                                        <servicio.icon className="size-4" />
                                    </span>
                                    {servicio.label}
                                </li>
                            ))}
                        </ul>

                        <div>
                            <Link
                                href={auth.user ? dashboard() : login()}
                                data-test="welcome-login"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-5 text-sm font-medium"
                            >
                                {auth.user ? 'Ir al panel' : 'Iniciar sesión'}
                            </Link>
                        </div>
                    </div>

                    <div className="bg-muted/40 flex min-h-64 items-center justify-center border-t p-10 md:border-t-0 md:border-l">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={name}
                                className="max-h-56 w-full max-w-xs object-contain"
                            />
                        ) : (
                            <span className="text-center text-3xl font-semibold">
                                {name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
