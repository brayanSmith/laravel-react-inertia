const PRIMARY_KEY = 'primary-color';
const PRIMARY_DARK_KEY = 'primary-color-dark';
const NAV_KEY = 'nav-color';
const STYLE_ID = 'theme-colors-style';

type Preset = { label: string; value: string | null };

/**
 * Color choices offered in Apariencia. "Original" (null) means no override:
 * the app's own default for that picker, set in app.css — platform color
 * rgb(37 99 235) in light and rgb(31 41 55) in dark, menu rgb(31 41 55).
 */
export const PRIMARY_COLOR_PRESETS: Preset[] = [
    { label: 'Original', value: null },
    { label: 'Azul', value: '#2563eb' },
    { label: 'Celeste', value: '#0891b2' },
    { label: 'Verde', value: '#16a34a' },
    { label: 'Naranja', value: '#ea580c' },
    { label: 'Rojo', value: '#dc2626' },
    { label: 'Violeta', value: '#7c3aed' },
    { label: 'Rosa', value: '#db2777' },
];

export const NAV_COLOR_PRESETS: Preset[] = [
    { label: 'Original', value: null },
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
export const getStoredPrimaryColorDark = (): string | null =>
    read(PRIMARY_DARK_KEY);
export const getStoredNavColor = (): string | null => read(NAV_KEY);

/** The "platform color" bundle (buttons, selected menu item, focus ring). */
function platformRules(primary: string): string[] {
    const foreground = contrastColor(primary);

    return [
        `--primary: ${primary}`,
        `--primary-foreground: ${foreground}`,
        `--sidebar-primary: ${primary}`,
        `--sidebar-primary-foreground: ${foreground}`,
        `--ring: ${primary}`,
    ];
}

/**
 * Writes the chosen colors as overrides: platform color and menu color for
 * the light theme, and platform color for dark (its menu keeps its own —
 * only the platform color was asked to be changeable there). A null color
 * goes back to the app's default for that picker.
 */
export function applyThemeColors(
    primaryLight: string | null,
    nav: string | null,
    primaryDark: string | null,
): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.getElementById(STYLE_ID)?.remove();

    const lightRules = primaryLight ? platformRules(primaryLight) : [];

    if (nav) {
        const dark = luminance(nav) <= 0.6;

        lightRules.push(
            `--sidebar: ${nav}`,
            `--sidebar-foreground: ${contrastColor(nav)}`,
            `--sidebar-accent: ${dark ? 'rgb(255 255 255 / 0.14)' : 'rgb(0 0 0 / 0.07)'}`,
            `--sidebar-accent-foreground: ${contrastColor(nav)}`,
            `--sidebar-border: ${dark ? 'rgb(255 255 255 / 0.18)' : 'rgb(0 0 0 / 0.1)'}`,
        );
    }

    const darkRules = primaryDark ? platformRules(primaryDark) : [];

    const blocks: string[] = [];

    if (lightRules.length > 0) {
        blocks.push(`:root:not(.dark) { ${lightRules.join('; ')}; }`);
    }

    if (darkRules.length > 0) {
        blocks.push(`:root.dark { ${darkRules.join('; ')}; }`);
    }

    if (blocks.length === 0) {
        return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = blocks.join('\n');
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
    applyThemeColors(hex, getStoredNavColor(), getStoredPrimaryColorDark());
}

export function updatePrimaryColorDark(hex: string | null): void {
    save(PRIMARY_DARK_KEY, hex);
    applyThemeColors(getStoredPrimaryColor(), getStoredNavColor(), hex);
}

export function updateNavColor(hex: string | null): void {
    save(NAV_KEY, hex);
    applyThemeColors(getStoredPrimaryColor(), hex, getStoredPrimaryColorDark());
}

export function initializeThemeColor(): void {
    applyThemeColors(
        getStoredPrimaryColor(),
        getStoredNavColor(),
        getStoredPrimaryColorDark(),
    );
}
