const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Centre-crops an image file to a square and re-encodes it as .webp. Throws a user-readable Error. */
export async function toSquareWebp(file: File, size = 512): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > MAX_FILE_BYTES) throw new Error('That image is over 10 MB.');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('That image couldn’t be read.');
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.min(size, side);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Couldn’t process that image.');
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Browsers that can't encode webp hand back a png instead; that's still uploaded as is.
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!blob) throw new Error('Couldn’t process that image.');
  return blob;
}
