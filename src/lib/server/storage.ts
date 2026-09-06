import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "rutex";

export function getBucket(): string {
  return BUCKET;
}

export function makeStoragePath(
  folder: string,
  type: string,
  identifier: string,
  ext: string,
): string {
  const hash = Math.random().toString(36).slice(2, 8);
  return `${folder}/${type}-${identifier}-${hash}.${ext}`;
}

/**
 * Sube un archivo al storage de Supabase usando el service role.
 * Devuelve el path relativo (para getAssetUrl) o null si falla.
 */
export async function uploadToStorage(
  file: File,
  folder: string,
  type: string,
  identifier: string,
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = makeStoragePath(folder, type, identifier, ext);
  const arrayBuffer = await file.arrayBuffer();

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });

  if (error) return null;
  return path;
}

/**
 * Elimina un archivo del storage usando el service role.
 */
export async function removeFromStorage(path: string | null | undefined): Promise<void> {
  if (!path) return;
  if (/^https?:\/\//.test(path)) return;
  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([path]);
}