function getStorageBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  return base.replace(/\/$/, "");
}

export function getBucketName(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || "rutex";
}

// Supabase Storage rechaza claves con apóstrofes, %, #, etc. Esta función
// convierte un texto (p. ej. el nombre del cliente) a un segmento de clave seguro.
export function sanitizeStorageKeySegment(value: string, fallback = "archivo"): string {
  const clean = value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || fallback;
}

export function getAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path) || path.startsWith("data:")) return path;

  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${getStorageBaseUrl()}/storage/v1/object/public/${getBucketName()}/${clean}`;
}
