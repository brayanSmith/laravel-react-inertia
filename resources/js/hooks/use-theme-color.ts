const PRIMARY_KEY = 'primary-color';
const NAV_KEY = 'nav-color';
const STYLE_ID = 'theme-colors-style';

type Preset = { label: string; value: string | null };

/** Main color choices offered in Apariencia; the first one is the original. */
export const PRIMARY_COLOR_PRESETS: Preset[] = [
    { label: 'Negro (original)', value: null },
    { label: 'Azul', value: '#2563eb' },
    { label: 'Celeste', value: '#0891b2' },
    { label: 'Verde', value: '#16a34a' },
    { label: 'Naranja', value: '#ea580c' },
    { label: 'Rojo', value: '#dc2626' },
    { label: 'Violeta', value: '#7c3aed' },
    { label: 'Rosa', value: '#db2777' },
];

/** Background choices for the side menu; the first one is the original. */
export const NAV_COLOR_PRESETS: Preset[] = [
    { label: 'Blanco (original)', value: null },
    { label: 'Gris claro', value: '#e5e7eb' },
    { label: 'Azul claro', value: '#dbeafe' },
    { label: 'Verde claro', value: '#dcfce7' },
    { label: 'Crema', value: '#fef3c7' },
    { label: 'Gris oscuro', value: '#1f2937' },
    { label: 'Azul oscuro', value: '#1e3a8a' },
    { label: 'Verde oscuro', value: '#14532d' },
];

function luminance(hex: string): number {
    const value = hex.replace('#', '');
    const [red, green, blue] = [0, 2, 4].map(
        (start) => parseInt(value.slice(start, start + 2), 16) / 255,
    );

    return 0.299 * red + 0.587 * green + 0.114 * blue;
}

/** Black or white, whichever reads better on top of the given color. */
const contrastColor = (hex: string): string =>
    luminance(hex) > 0.6 ? '#111111' : '#ffffff';

const read = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

export const getStoredPrimaryColor = (): string | null => read(PRIMARY_KEY);
export const getStoredNavColor = (): string | null => read(NAV_KEY);

/**
 * Writes the chosen colors as light-theme overrides (dark keeps its own).
 * A null color goes back to the original one.
 */
export function applyThemeColors(
    primary: string | null,
    nav: string | null,
): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.getElementById(STYLE_ID)?.remove();

    const rules: string[] = [];

    if (primary) {
        const foreground = contrastColor(primary);

        rules.push(
            `--primary: ${primary}`,
            `--primary-foreground: ${foreground}`,
            `--sidebar-primary: ${primary}`,
            `--sidebar-primary-foreground: ${foreground}`,
            `--ring: ${primary}`,
        );
    }

    if (nav) {
        const dark = luminance(nav) <= 0.6;

        rules.push(
            `--sidebar: ${nav}`,
            `--sidebar-foreground: ${contrastColor(nav)}`,
            `--sidebar-accent: ${dark ? 'rgb(255 255 255 / 0.14)' : 'rgb(0 0 0 / 0.07)'}`,
            `--sidebar-accent-foreground: ${contrastColor(nav)}`,
            `--sidebar-border: ${dark ? 'rgb(255 255 255 / 0.18)' : 'rgb(0 0 0 / 0.1)'}`,
        );
    }

    if (rules.length === 0) {
        return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `:root:not(.dark) { ${rules.join('; ')}; }`;
    document.head.appendChild(style);
}

function save(key: string, value: string | null): void {
    try {
        if (value) {
            localStorage.setItem(key, value);
        } else {
            localStorage.removeItem(key);
        }
    } catch {
        // Not persisted (private window); it still applies for this visit.
    }
}

export function updatePrimaryColor(hex: string | null): void {
    save(PRIMARY_KEY, hex);
    applyThemeColors(hex, getStoredNavColor());
}

export function updateNavColor(hex: string | null): void {
    save(NAV_KEY, hex);
    applyThemeColors(getStoredPrimaryColor(), hex);
}

export function initializeThemeColor(): void {
    applyThemeColors(getStoredPrimaryColor(), getStoredNavColor());
}
