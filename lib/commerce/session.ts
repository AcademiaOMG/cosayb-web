"use client"

import { authClient } from "@/lib/auth"

export interface CommerceSession {
  isPending: boolean
  isAuthenticated: boolean
  user: { id: string; name: string; email: string } | null
}

/**
 * Estado de sesión real (Better Auth) para el flujo comercial. Reemplaza el
 * viejo `isAuthenticated()` basado en localStorage.
 */
export function useCommerceSession(): CommerceSession {
  const { data, isPending } = authClient.useSession()
  const user = data?.user
    ? { id: data.user.id, name: data.user.name ?? "", email: data.user.email ?? "" }
    : null
  return {
    isPending,
    isAuthenticated: !!data?.user,
    user,
  }
}

/** Versión imperativa para handlers (fuera de render). */
export async function fetchCommerceSession(): Promise<CommerceSession> {
  try {
    const { data } = await authClient.getSession()
    const user = data?.user
      ? { id: data.user.id, name: data.user.name ?? "", email: data.user.email ?? "" }
      : null
    return { isPending: false, isAuthenticated: !!user, user }
  } catch {
    return { isPending: false, isAuthenticated: false, user: null }
  }
}
