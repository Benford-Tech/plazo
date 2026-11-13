/** What the server takes for the meeting point's photo (MAX_MEETING_PHOTO_BYTES, 13/11/2026). */
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const SENT_AS_IS = ["image/jpeg", "image/png", "image/webp"];

/**
 * A photo ready to send: a small JPEG, PNG or WebP goes as it is; anything else (a phone's 6 MB photo, a HEIC the browser
 * can read) is drawn again as a JPEG of 1 600 px at most. Null when the browser cannot read the file as an image.
 */
export async function shrinkPhoto(file: File, max = 1600): Promise<Blob | null> {
  if (SENT_AS_IS.includes(file.type) && file.size <= 1.5 * 1024 * 1024) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise(resolve => canvas.toBlob(b => resolve(b), "image/jpeg", 0.82));
}
