import { ImagePlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
    value?: string | null;
    onChange: (file: File | null, removed: boolean) => void;
    error?: string;
};

export default function ProductoImageUpload({ value, onChange, error }: Props) {
    const [preview, setPreview] = useState<string | null>(value ?? null);

    useEffect(() => {
        setPreview(value ?? null);
    }, [value]);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];

            if (!file) {
                return;
            }

            setPreview(URL.createObjectURL(file));
            onChange(file, false);
        },
        [onChange],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
        multiple: false,
    });

    const removeImage = () => {
        setPreview(null);
        onChange(null, true);
    };

    return (
        <div className="space-y-3">
            <div
                {...getRootProps()}
                className={cn(
                    'cursor-pointer rounded-md border-2 border-dashed transition-colors',
                    isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:bg-accent/50',
                )}
            >
                <input {...getInputProps()} />

                {preview ? (
                    <div className="space-y-2 p-3">
                        <p className="text-muted-foreground text-sm">
                            Imagen Cargada
                        </p>
                        <img
                            src={preview}
                            alt=""
                            className="aspect-square w-full rounded-md border object-contain"
                        />
                    </div>
                ) : (
                    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-center">
                        <ImagePlus className="h-8 w-8" />
                        <span className="text-sm">
                            Arrastra una imagen o haz clic
                        </span>
                    </div>
                )}
            </div>

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            {preview ? (
                <Button
                    type="button"
                    variant="outline"
                    data-test="producto-imagen-remove"
                    className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive w-full"
                    onClick={removeImage}
                >
                    Eliminar imagen
                </Button>
            ) : null}
        </div>
    );
}
