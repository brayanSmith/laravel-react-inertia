const MESES = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
];

/**
 * A date as DD/MMM/YYYY (07/Sep/2026). Only the calendar date of the value is
 * used (the first 10 characters of an ISO string), so the timezone never
 * shifts the day.
 */
export function formatFechaCorta(value: string | null | undefined): string {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!match) {
        return value ?? '';
    }

    const [, year, month, day] = match;

    return `${day}/${MESES[Number(month) - 1]}/${year}`;
}
