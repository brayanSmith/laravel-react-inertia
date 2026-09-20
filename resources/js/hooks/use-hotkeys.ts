import { useEffect, useRef } from 'react';

export type Hotkey = {
    /** `KeyboardEvent.key`, e.g. 'F9', '+', 'n' (letters compare case-insensitively). */
    key: string;
    /** `KeyboardEvent.code` alternative, for keys whose `key` varies (e.g. 'Digit1'). */
    code?: string;
    shift?: boolean;
    alt?: boolean;
    ctrl?: boolean;
    handler: () => void;
};

type Options = {
    /** Skip the shortcuts while a dialog is open, so they don't act behind it. */
    ignoreWhenDialog?: boolean;
};

/**
 * Global keyboard shortcuts for a screen. Matching shortcuts have their
 * browser default prevented (F1 help, F3 find, F10 menu…) and run the
 * handler; the list can change every render without re-binding.
 */
export function useHotkeys(hotkeys: Hotkey[], options: Options = {}) {
    const hotkeysRef = useRef(hotkeys);
    hotkeysRef.current = hotkeys;
    const ignoreWhenDialog = options.ignoreWhenDialog ?? false;

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (ignoreWhenDialog && document.querySelector('[role="dialog"]')) {
                return;
            }

            const match = hotkeysRef.current.find(
                (hotkey) =>
                    (hotkey.code
                        ? event.code === hotkey.code
                        : event.key.toLowerCase() ===
                          hotkey.key.toLowerCase()) &&
                    Boolean(hotkey.shift) === event.shiftKey &&
                    Boolean(hotkey.alt) === event.altKey &&
                    Boolean(hotkey.ctrl) === (event.ctrlKey || event.metaKey),
            );

            if (match) {
                event.preventDefault();
                match.handler();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [ignoreWhenDialog]);
}
