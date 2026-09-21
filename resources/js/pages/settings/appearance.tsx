import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import ColorPicker from '@/components/color-picker';
import Heading from '@/components/heading';
import {
    getStoredNavColor,
    getStoredPrimaryColor,
    NAV_COLOR_PRESETS,
    PRIMARY_COLOR_PRESETS,
    updateNavColor,
    updatePrimaryColor,
} from '@/hooks/use-theme-color';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Apariencia" />

            <h1 className="sr-only">Apariencia</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Apariencia"
                    description="Actualiza la apariencia de tu cuenta"
                />
                <AppearanceTabs />
            </div>

            <div className="mt-10 space-y-6">
                <Heading
                    variant="small"
                    title="Color de la plataforma"
                    description="Cambia el color principal (botones, selección y contorno de los campos) en el tema claro. Se guarda en este navegador."
                />
                <ColorPicker
                    presets={PRIMARY_COLOR_PRESETS}
                    originalSwatch="#171717"
                    stored={getStoredPrimaryColor()}
                    onChange={updatePrimaryColor}
                    dataTest="primary-color"
                />
            </div>

            <div className="mt-10 space-y-6">
                <Heading
                    variant="small"
                    title="Color del menú"
                    description="Cambia el color de fondo del menú lateral en el tema claro. Se guarda en este navegador."
                />
                <ColorPicker
                    presets={NAV_COLOR_PRESETS}
                    originalSwatch="#ffffff"
                    stored={getStoredNavColor()}
                    onChange={updateNavColor}
                    dataTest="nav-color"
                />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Apariencia',
            href: editAppearance(),
        },
    ],
};
