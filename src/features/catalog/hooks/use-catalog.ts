"use client"

import { useQuery } from "@tanstack/react-query"

import { getCatalogRequest } from "@/features/catalog/api/catalog.api"

export const catalogKeys = {
  all: ["catalog"] as const,
}

export function useCatalog() {
  return useQuery({
    queryKey: catalogKeys.all,
    queryFn: getCatalogRequest,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  })
}