"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  getCarteraReportRequest,
  getClientSalesReportRequest,
  getCompraReportRequest,
  getGastoReportRequest,
  getHourSalesReportRequest,
  getMermaReportRequest,
  getPerdidaReportRequest,
  getProductSalesReportRequest,
  getProfitReportRequest,
  getResumenReportRequest,
} from "@/features/reports/api/reports.api"

export const reportsKeys = {
  profit: (from: string, to: string) => ["reports", "profit", from, to] as const,
  products: (from: string, to: string) => ["reports", "products", from, to] as const,
  clients: (from: string, to: string) => ["reports", "clients", from, to] as const,
  cartera: (from: string, to: string) => ["reports", "cartera", from, to] as const,
  hours: (from: string, to: string) => ["reports", "hours", from, to] as const,
  gastos: (from: string, to: string) => ["reports", "gastos", from, to] as const,
  compras: (from: string, to: string) => ["reports", "compras", from, to] as const,
  mermas: (from: string, to: string) => ["reports", "mermas", from, to] as const,
  perdidas: (from: string, to: string) => ["reports", "perdidas", from, to] as const,
  resumen: (from: string, to: string) => ["reports", "resumen", from, to] as const,
}

export function useProfitReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.profit(from, to),
    queryFn: () => getProfitReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}

export function useProductSalesReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.products(from, to),
    queryFn: () => getProductSalesReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}

export function useClientSalesReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.clients(from, to),
    queryFn: () => getClientSalesReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}

export function useCarteraReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.cartera(from, to),
    queryFn: () => getCarteraReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}

export function useHourSalesReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.hours(from, to),
    queryFn: () => getHourSalesReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}

export function useGastoReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.gastos(from, to),
    queryFn: () => getGastoReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}

export function useCompraReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.compras(from, to),
    queryFn: () => getCompraReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}

export function useMermaReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.mermas(from, to),
    queryFn: () => getMermaReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}

export function usePerdidaReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.perdidas(from, to),
    queryFn: () => getPerdidaReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}

export function useResumenReport(from: string, to: string) {
  return useQuery({
    queryKey: reportsKeys.resumen(from, to),
    queryFn: () => getResumenReportRequest(from, to),
    placeholderData: keepPreviousData,
  })
}