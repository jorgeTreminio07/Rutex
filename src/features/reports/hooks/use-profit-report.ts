"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { getProfitReportRequest } from "@/features/reports/api/reports.api"

export const reportsKeys = {
  profit: (from: string, to: string) => ["reports", "profit", from, to] as const,
}

export function useProfitReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.profit(from, to),
    queryFn: () => getProfitReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}