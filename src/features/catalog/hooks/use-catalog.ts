"use client"

import { useQuery } from "@tanstack/react-query"

import { getCatalogRequest } from "@/features/catalog/api/catalog.api"
import { LIST_REFRESH_MS } from "@/lib/query-params"

export const catalogKeys = {
  all: ["catalog"] as const,
}

export function useCatalog() {
  return useQuery({
    queryKey: catalogKeys.all,
    queryFn: getCatalogRequest,
    refetchInterval: LIST_REFRESH_MS,
  })
}