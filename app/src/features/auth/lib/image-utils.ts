export async function resizeAndCropImage(file: File, name: string, size: number, extension: string): Promise<File> {
    const image = await loadImage(file);

    const canvas = document.createElement("canvas");

    canvas.width = canvas.height = size;

    const context = canvas.getContext("2d");

    const minEdge = Math.min(image.width, image.height);

    const sx = (image.width - minEdge) / 2;
    const sy = (image.height - minEdge) / 2;
    const sWidth = minEdge;
    const sHeight = minEdge;

    context?.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, size, size);

    const resizedImageBlob = await new Promise<Blob | null>((resolve) => { canvas.toBlob(resolve, `image/${extension}`); });

    return new File([resizedImageBlob as BlobPart], `${name}.${extension}`, {
        type: `image/${extension}`,
    });
}

async function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const reader = new FileReader();

        reader.addEventListener("load", (e) => {
            image.src = e.target?.result as string;
        });

        image.addEventListener("load", () => { resolve(image); });
        image.onerror = (error) => { reject(error); };

        reader.readAsDataURL(file);
    });
}

export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => { resolve(reader.result as string); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
