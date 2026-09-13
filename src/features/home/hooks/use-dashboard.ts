"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { getDashboardRequest } from "@/features/home/api/dashboard.api"

export const dashboardKeys = {
  all: ["dashboard", "summary"] as const,
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: getDashboardRequest,
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}