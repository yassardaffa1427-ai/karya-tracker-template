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
      // Sinkronkan state langsung dari hasil register/Google, bukan cuma mengandalkan
      // listener onAuthChange — listener bisa sempat menyimpan profil dengan nama
      // kosong lebih dulu akibat race dengan pemanggilan ensureProfile di adapter.
      register: async (name, email, password) => {
        const nextUser = await adapter.register(name, email, password)
        setUser(nextUser)
        return nextUser
      },
      signInWithGoogle: async () => {
        const nextUser = await adapter.signInWithGoogle()
        setUser(nextUser)
        return nextUser
      },
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
