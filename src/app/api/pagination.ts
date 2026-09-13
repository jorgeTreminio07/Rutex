export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

// PostgREST limita cada respuesta a 1000 filas por defecto. fetchAllRows recorre
// por chunks para que un GET "fetch all" nunca trunque silenciosamente los datos.
const CHUNK_SIZE = 500

interface ChunkResponse<T> {
  data: T[] | null
  error: unknown
}

type Thenable<T> = {
  then: (
    onfulfilled?: (value: T) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => unknown
}

export interface Pagination {
  page: number
  pageSize: number
  from: number
  to: number
}

export function parsePagination(url: URL): Pagination {
  const rawPage = Number(url.searchParams.get("page"))
  const rawPageSize = Number(url.searchParams.get("pageSize"))

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const pageSize =
    Number.isInteger(rawPageSize) && rawPageSize > 0
      ? Math.min(rawPageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { page, pageSize, from, to }
}

/** true si el endpoint debe devolver { data, total, page, pageSize } en vez de un array. */
export function isPaging(url: URL): boolean {
  return url.searchParams.has("page")
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return { data, total, page, pageSize }
}

/**
 * Ejecuta el query en chunks de 500 filas hasta que una respuesta venga con menos
 * filas que el chunk (o 0), evitando el tope de 1000 de PostgREST.
 */
export async function fetchAllRows<T>(
  fetchChunk: (from: number, to: number) => Thenable<ChunkResponse<T>>,
): Promise<{ data: T[]; error: null } | { data: null; error: unknown }> {
  const all: T[] = []
  for (let from = 0; ; from += CHUNK_SIZE) {
    const { data, error } = await fetchChunk(from, from + CHUNK_SIZE - 1)
    if (error) return { data: null, error }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < CHUNK_SIZE) break
  }
  return { data: all, error: null }
}