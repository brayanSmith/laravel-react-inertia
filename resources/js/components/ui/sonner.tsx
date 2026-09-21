import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    // On phones the modals rise from the bottom, so the toasts go on top.
    const isWide = useMediaQuery('(min-width: 640px)');

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position={isWide ? 'bottom-right' : 'top-center'}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
