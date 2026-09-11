interface ApiErrorBody {
  message?: string
  errors?: { message: string }[]
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "same-origin",
  })

  if (res.status === 204) {
    return undefined as T
  }

  const contentType = res.headers.get("content-type") ?? ""
  const body = contentType.includes("application/json")
    ? ((await res.json()) as ApiErrorBody | T)
    : null

  if (!res.ok) {
    const err = body as ApiErrorBody | null
    const message = err?.message || err?.errors?.map((e) => e.message).join(", ") || "Ocurrió un error. Intenta de nuevo."
    throw new ApiError(message, res.status)
  }

  return body as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  delete: <T = void>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
}

export function getApiErrorMessage(error: unknown, fallback = "Ocurrió un error. Intenta de nuevo."): string {
  if (error instanceof ApiError) return error.message
  return fallback
}