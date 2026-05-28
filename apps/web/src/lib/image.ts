const WEBP_QUALITY = 0.82;

async function decodeImage(file: File): Promise<HTMLImageElement> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to decode image."));
    img.src = dataUrl;
  });
}

export async function convertImageToWebp(file: File): Promise<File> {
  if (file.type === "image/webp") return file;

  const image = await decodeImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to initialize image conversion.");

  context.drawImage(image, 0, 0);

  const webpBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("WebP conversion returned an empty image."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      WEBP_QUALITY,
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([webpBlob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}
