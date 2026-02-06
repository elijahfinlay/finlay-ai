import { put, del } from "@vercel/blob";

export async function uploadFile(
  bucket: string,
  filePath: string,
  file: Buffer | Uint8Array,
  contentType: string
): Promise<{ path: string; url: string }> {
  const pathname = `${bucket}/${filePath}`;
  const body = Buffer.isBuffer(file) ? file : Buffer.from(file);

  const blob = await put(pathname, body, {
    access: "public",
    contentType,
  });

  return { path: filePath, url: blob.url };
}

export function getPublicUrl(_bucket: string, _filePath: string): string {
  // With Vercel Blob, URLs are returned at upload time and stored in the DB.
  // This function is kept for interface compatibility but shouldn't be needed.
  throw new Error("Use the stored URL from uploadFile instead of getPublicUrl");
}

export async function deleteFile(_bucket: string, url: string): Promise<void> {
  // Vercel Blob deletes by URL, not by path
  await del(url);
}
