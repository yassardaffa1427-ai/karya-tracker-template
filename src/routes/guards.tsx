import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface">
      <div className="flex flex-col items-center gap-3 text-ink-muted">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden />
        <p className="text-[13px]">Menyiapkan vilism.checker…</p>
      </div>
    </div>
  )
}

/** Halaman yang butuh sesi login. `adminOnly` menegakkan matriks izin PRD bagian 8. */
export function RequireAuth({
  children,
  adminOnly,
}: {
  children: React.ReactNode
  adminOnly?: boolean
}) {
  const { user, initializing, isAdmin } = useAuth()
  const location = useLocation()

  if (initializing) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  // Admin tidak submit karya, jadi arahkan mereka ke dashboard admin.
  if (!adminOnly && isAdmin && location.pathname === '/') return <Navigate to="/admin" replace />

  return <>{children}</>
}

/** Halaman publik (login/register): user yang sudah login langsung dilempar ke dashboard. */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, initializing, isAdmin } = useAuth()

  if (initializing) return <FullScreenLoader />
  if (user) return <Navigate to={isAdmin ? '/admin' : '/'} replace />

  return <>{children}</>
}
