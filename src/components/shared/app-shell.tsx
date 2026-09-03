import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  PlusCircle,
  Shield,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import {
  markAllNotificationsRead,
  useAdminNotifications,
} from '@/features/notifications/notification-store'
import { isMockMode } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/shared/footer'
import { formatDateTime } from '@/lib/dates'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const USER_NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: LayoutGrid },
  { to: '/submit', label: 'Submit Karya', icon: PlusCircle },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Responden', icon: Users },
  { to: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/admin/management', label: 'Admin', icon: Shield },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const notifications = useAdminNotifications()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const nav = isAdmin ? ADMIN_NAV : USER_NAV
  const unread = notifications.filter((item) => !item.read).length

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface">
      <header className="sticky top-0 z-30 bg-surface/85 px-3 pb-3 pt-3 backdrop-blur-sm sm:px-6 sm:pb-4 sm:pt-5">
        <div className="dark-scope mx-auto flex max-w-[1320px] items-center gap-3 rounded-full bg-darkbg-main px-3 py-2.5 shadow-dark-panel sm:px-4">
          <div className="flex items-center gap-2.5 pl-1 pr-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden text-[15px] font-bold tracking-tight text-white sm:block">
              Karya<span className="text-brand-400">Tracker</span>
            </span>
          </div>

          <nav aria-label="Navigasi utama" className="hidden flex-1 items-center gap-1 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors',
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {isMockMode() ? (
              <span className="hidden rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-300 lg:block">
                Mode demo lokal
              </span>
            ) : null}

            {isAdmin ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen((open) => !open)
                    if (!notifOpen) markAllNotificationsRead()
                  }}
                  aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`}
                  className="relative grid h-9 w-9 place-items-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Bell className="h-[18px] w-[18px]" aria-hidden />
                  {unread > 0 ? (
                    <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  ) : null}
                </button>

                {notifOpen ? (
                  <div className="absolute right-0 top-12 w-[320px] overflow-hidden rounded-card border border-line bg-white shadow-card-md animate-slide-up">
                    <p className="border-b border-line px-4 py-3 text-[13px] font-semibold text-ink">
                      Notifikasi submission
                    </p>
                    <ul className="fin-scroll max-h-72 divide-y divide-line overflow-y-auto">
                      {notifications.length === 0 ? (
                        <li className="px-4 py-6 text-center text-[13px] text-ink-muted">
                          Belum ada notifikasi.
                        </li>
                      ) : (
                        notifications.map((item) => (
                          <li key={item.id} className="px-4 py-3">
                            <p className="text-[13px] font-medium text-ink">{item.message}</p>
                            <p className="mt-0.5 text-[11px] text-ink-faint">
                              {formatDateTime(item.createdAt)}
                            </p>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-2.5 text-left transition-colors hover:bg-white/15"
              >
                <Avatar name={user?.name ?? '?'} photoUrl={user?.photoUrl} size="sm" />
                <span className="hidden max-w-[120px] truncate text-[13px] font-semibold text-white sm:block">
                  {user?.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-card border border-line bg-white shadow-card-md animate-slide-up">
                  <div className="space-y-1 border-b border-line px-4 py-3">
                    <p className="truncate text-[14px] font-semibold text-ink">{user?.name}</p>
                    <p className="truncate text-[12px] text-ink-muted">{user?.email}</p>
                    <Badge tone={isAdmin ? 'brand' : 'neutral'}>
                      {isAdmin ? 'Admin' : 'Kontributor'}
                    </Badge>
                  </div>
                  <NavLink
                    to="/profil"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-surface-overlay"
                  >
                    Profil & akun
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-medium text-[#B91C1C] hover:bg-[#FEE2E2]"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Keluar
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Buka menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <nav
            aria-label="Navigasi mobile"
            className="mx-auto mt-2 max-w-[1320px] space-y-1 rounded-container border border-line bg-white p-2 shadow-card-md md:hidden"
          >
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/' || item.to === '/admin'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-control px-3 py-2.5 text-[14px] font-semibold',
                    isActive ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-surface-overlay',
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </header>

      {(notifOpen || menuOpen) && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => {
            setNotifOpen(false)
            setMenuOpen(false)
          }}
        />
      )}

      <main className="mx-auto max-w-[1320px] px-3 pb-24 pt-3 sm:px-6 sm:pb-16">
        {children}
        <Footer />
      </main>

      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-white/95 px-2 py-2 backdrop-blur md:hidden"
      >
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/' || item.to === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-control py-1.5 text-[10px] font-semibold',
                isActive ? 'text-brand-600' : 'text-ink-faint',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-9 tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="text-[14px] text-ink-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
