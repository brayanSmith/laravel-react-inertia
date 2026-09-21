import { useSyncExternalStore } from 'react';

/** Whether a CSS media query matches right now, following window resizes. */
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (callback) => {
            const list = window.matchMedia(query);

            list.addEventListener('change', callback);

            return () => list.removeEventListener('change', callback);
        },
        () => window.matchMedia(query).matches,
        () => false,
    );
}
