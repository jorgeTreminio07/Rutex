export const LIST_PAGE_SIZE = 10

export const LIST_REFRESH_MS = 30_000

export interface ListQueryParams {
  page?: number
  pageSize?: number
  search?: string
  date?: string
}

export function appendListParams(url: URL, params: ListQueryParams): void {
  if (params.page !== undefined) url.searchParams.set("page", String(params.page))
  if (params.pageSize !== undefined) url.searchParams.set("pageSize", String(params.pageSize))
  if (params.search) url.searchParams.set("search", params.search)
  if (params.date) url.searchParams.set("date", params.date)
}