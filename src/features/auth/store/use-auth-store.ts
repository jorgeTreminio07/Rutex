import { create } from "zustand"

import type { AuthUser } from "@/types/interfaces/auth.interface"

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isHydrated: boolean
  setUser: (user: AuthUser | null) => void
  clear: () => void
  markHydrated: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  setUser: (user) =>
    set({ user, isAuthenticated: Boolean(user), isHydrated: true }),
  clear: () => set({ user: null, isAuthenticated: false, isHydrated: true }),
  markHydrated: () => set({ isHydrated: true }),
}))