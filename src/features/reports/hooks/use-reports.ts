"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  getCarteraReportRequest,
  getClientSalesReportRequest,
  getHourSalesReportRequest,
  getProductSalesReportRequest,
  getProfitReportRequest,
} from "@/features/reports/api/reports.api"

export const reportsKeys = {
  profit: (from: string, to: string) => ["reports", "profit", from, to] as const,
  products: (from: string, to: string) => ["reports", "products", from, to] as const,
  clients: (from: string, to: string) => ["reports", "clients", from, to] as const,
  cartera: (from: string, to: string) => ["reports", "cartera", from, to] as const,
  hours: (from: string, to: string) => ["reports", "hours", from, to] as const,
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