"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addBankAccountRequest,
  addCityRequest,
  deleteBankAccountRequest,
  deleteCityRequest,
  getCitiesRequest,
  getStoreProfileRequest,
  updateBankAccountRequest,
  updateStoreProfileRequest,
  type BankAccountPayload,
  type UpdateStorePayload,
} from "@/features/store/api/store.api"
import { getApiErrorMessage } from "@/lib/api-client"

export const storeKeys = {
  all: ["store"] as const,
}

export function useStore() {
  return useQuery({
    queryKey: storeKeys.all,
    queryFn: getStoreProfileRequest,
  })
}

export function useUpdateStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateStorePayload) => updateStoreProfileRequest(payload),
    onSuccess: () => {
      toast.success("Datos de la tienda actualizados")
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudieron actualizar los datos de la tienda")),
  })
}

export function useAddBankAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BankAccountPayload) => addBankAccountRequest(payload),
    onSuccess: () => {
      toast.success("Cuenta bancaria agregada correctamente")
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo agregar la cuenta bancaria")),
  })
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BankAccountPayload }) =>
      updateBankAccountRequest(id, payload),
    onSuccess: () => {
      toast.success("Cuenta bancaria actualizada correctamente")
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar la cuenta bancaria")),
  })
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBankAccountRequest(id),
    onSuccess: () => {
      toast.success("Cuenta bancaria eliminada correctamente")
      queryClient.invalidateQueries({ queryKey: storeKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la cuenta bancaria")),
  })
}

export const citiesKeys = {
  all: ["cities"] as const,
}

export function useCities() {
  return useQuery({
    queryKey: citiesKeys.all,
    queryFn: getCitiesRequest,
  })
}

export function useAddCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string }) => addCityRequest(payload),
    onSuccess: () => {
      toast.success("Ciudad agregada correctamente")
      queryClient.invalidateQueries({ queryKey: citiesKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo agregar la ciudad")),
  })
}

export function useDeleteCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCityRequest(id),
    onSuccess: () => {
      toast.success("Ciudad eliminada correctamente")
      queryClient.invalidateQueries({ queryKey: citiesKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la ciudad")),
  })
}