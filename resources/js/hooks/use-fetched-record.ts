import { useHttp } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type RouteDefinition = { url: string; method: string };

/**
 * Loads one record's full detail (a JSON endpoint) while `action` is set,
 * for read-only modals: the listings stay light and the detail is only
 * fetched when someone opens it. Pass `null` to keep it closed.
 */
export function useFetchedRecord<T>(action: RouteDefinition | null) {
    const { submit } = useHttp();
    const [record, setRecord] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);

    const url = action?.url ?? null;

    useEffect(() => {
        if (!action) {
            setRecord(null);
            setFailed(false);

            return;
        }

        let cancelled = false;
        setLoading(true);
        setFailed(false);
        setRecord(null);

        submit('get', action.url)
            .then((response) => {
                if (!cancelled) {
                    setRecord(response as T);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setFailed(true);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]);

    return { record, loading, failed };
}
