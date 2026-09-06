function getStorageBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  return base.replace(/\/$/, "");
}

function getBucketName(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || "rutex";
}

export function getAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path) || path.startsWith("data:")) return path;

  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${getStorageBaseUrl()}/storage/v1/object/public/${getBucketName()}/${clean}`;
}
