import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  });
  return compressed as File;
}


