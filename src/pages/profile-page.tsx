import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Database, LogOut, Mail, RotateCcw, ShieldCheck, UserCircle2 } from 'lucide-react'
import { formatShortDate } from '@/lib/dates'
import { isMockMode, resetMockDatabase } from '@/lib/data'
import { useAuth } from '@/features/auth/auth-context'
import { clearNotifications } from '@/features/notifications/notification-store'
import { AppShell, PageHeader } from '@/components/shared/app-shell'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function ProfilePage() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  function handleReset() {
    clearNotifications()
    resetMockDatabase()
    toast.success('Data demo dikembalikan ke kondisi awal.')
    window.location.reload()
  }

  return (
    <AppShell>
      <PageHeader title="Profil & akun" subtitle="Informasi akun kamu di vilism.checker." />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="fin-card p-6">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name ?? '?'} photoUrl={user?.photoUrl} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-[18px] font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-[13px] text-ink-muted">{user?.email}</p>
            </div>
          </div>

          <dl className="mt-6 space-y-3.5">
            <Row icon={ShieldCheck} label="Role">
              <Badge tone={isAdmin ? 'brand' : 'neutral'}>
                {isAdmin ? 'Admin' : 'Kontributor'}
              </Badge>
            </Row>
            <Row icon={Mail} label="Metode masuk">
              <span className="text-[13px] text-ink">
                {user?.authProvider === 'google' ? 'Google sign-in' : 'Email & password'}
              </span>
            </Row>
            <Row icon={UserCircle2} label="Bergabung">
              <span className="text-[13px] text-ink">
                {user ? formatShortDate(user.createdAt) : '—'}
              </span>
            </Row>
          </dl>

          <Button variant="secondary" className="mt-6" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" aria-hidden />
            Keluar dari akun
          </Button>
        </section>

        <section className="dark-scope fin-container p-6">
          <div className="flex items-center gap-2">
            <Database className="h-[18px] w-[18px] text-brand-400" aria-hidden />
            <h2 className="text-[18px] font-semibold text-white">Sumber data</h2>
          </div>

          <p className="mt-2 text-[13px] leading-6 text-slate-400">
            {isMockMode()
              ? 'App sedang berjalan di mode demo lokal: data disimpan di browser kamu (localStorage) dengan seed 5 akun dan puluhan karya. Isi keenam variabel VITE_FIREBASE_* di .env untuk otomatis beralih ke Firebase Auth + Firestore.'
              : 'App terhubung ke Firebase Auth + Firestore. Aturan akses ditegakkan lewat Firestore Security Rules di firestore.rules.'}
          </p>

          {isMockMode() ? (
            <Button variant="onDark" className="mt-5" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset data demo
            </Button>
          ) : null}
        </section>
      </div>
    </AppShell>
  )
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0">
      <dt className="flex items-center gap-2 text-[13px] text-ink-muted">
        <Icon className="h-4 w-4 text-ink-faint" aria-hidden />
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}
