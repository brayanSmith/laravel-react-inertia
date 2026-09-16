import { ImagePlus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Area } from 'react-easy-crop';
import Cropper from 'react-easy-crop';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getCroppedImageFile } from '@/lib/crop-image';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    value?: string | null;
    onChange: (file: File | null, removed: boolean) => void;
    error?: string;
};

export default function ImageDropCropper({
    label,
    value,
    onChange,
    error,
}: Props) {
    const [preview, setPreview] = useState<string | null>(value ?? null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [cropOpen, setCropOpen] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
        null,
    );

    useEffect(() => {
        setPreview(value ?? null);
    }, [value]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];

        if (!file) {
            return;
        }

        setCropSrc(URL.createObjectURL(file));
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropOpen(true);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
        multiple: false,
    });

    const closeCropDialog = () => {
        setCropOpen(false);

        if (cropSrc) {
            URL.revokeObjectURL(cropSrc);
        }

        setCropSrc(null);
    };

    const applyCrop = async () => {
        if (!cropSrc || !croppedAreaPixels) {
            return;
        }

        const file = await getCroppedImageFile(
            cropSrc,
            croppedAreaPixels,
            'imagen.jpg',
        );

        setPreview(URL.createObjectURL(file));
        onChange(file, false);
        closeCropDialog();
    };

    const removeImage = (event: React.MouseEvent) => {
        event.stopPropagation();
        setPreview(null);
        onChange(null, true);
    };

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>

            <div
                {...getRootProps()}
                className={cn(
                    'relative flex h-40 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed transition-colors',
                    isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:bg-accent/50',
                )}
            >
                <input {...getInputProps()} />

                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={removeImage}
                            data-test="image-remove-button"
                            className="bg-background/80 text-foreground hover:bg-background absolute top-1 right-1 rounded-full p-1"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </>
                ) : (
                    <div className="text-muted-foreground flex flex-col items-center gap-1 px-2 text-center">
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-xs">
                            Arrastra una imagen o haz clic
                        </span>
                    </div>
                )}
            </div>

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <Dialog
                open={cropOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCropDialog();
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ajustar imagen</DialogTitle>
                    </DialogHeader>

                    <div className="bg-muted relative h-72 w-full overflow-hidden rounded-md">
                        {cropSrc ? (
                            <Cropper
                                image={cropSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_, pixels) =>
                                    setCroppedAreaPixels(pixels)
                                }
                            />
                        ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm">
                            Zoom
                        </span>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(event) =>
                                setZoom(Number(event.target.value))
                            }
                            className="accent-primary flex-1"
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="secondary" onClick={closeCropDialog}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            data-test="crop-apply-button"
                            onClick={applyCrop}
                        >
                            Aplicar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
