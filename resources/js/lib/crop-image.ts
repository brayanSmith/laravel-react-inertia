export type PixelCrop = {
    x: number;
    y: number;
    width: number;
    height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (event) => reject(event));
        image.crossOrigin = 'anonymous';
        image.src = src;
    });
}

export async function getCroppedImageFile(
    imageSrc: string,
    crop: PixelCrop,
    fileName: string,
): Promise<File> {
    const image = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;

    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('No se pudo procesar la imagen.');
    }

    context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92),
    );

    if (!blob) {
        throw new Error('No se pudo procesar la imagen.');
    }

    return new File([blob], fileName, { type: 'image/jpeg' });
}
