import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { AppUser } from '@/types'
import { getAdapter } from '@/lib/data'

interface AuthContextValue {
  user: AppUser | null
  initializing: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<AppUser>
  register: (name: string, email: string, password: string) => Promise<AppUser>
  signInWithGoogle: () => Promise<AppUser>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const adapter = useMemo(() => getAdapter(), [])
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AppUser | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    return adapter.onAuthChange((nextUser) => {
      setUser(nextUser)
      setInitializing(false)
    })
  }, [adapter])

  const signOut = useCallback(async () => {
    await adapter.signOut()
    // Buang cache milik sesi sebelumnya agar tidak bocor ke akun berikutnya.
    queryClient.clear()
  }, [adapter, queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAdmin: user?.role === 'admin',
      signIn: (email, password) => adapter.signIn(email, password),
      register: (name, email, password) => adapter.register(name, email, password),
      signInWithGoogle: () => adapter.signInWithGoogle(),
      signOut,
      sendPasswordReset: (email) => adapter.sendPasswordReset(email),
    }),
    [adapter, initializing, signOut, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return context
}
