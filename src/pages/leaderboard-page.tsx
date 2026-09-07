import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Award, Medal, Sparkles, Trophy, User, Users } from 'lucide-react'
import { track } from '@/lib/analytics'
import { useAuth } from '@/features/auth/auth-context'
import { useLeaderboard } from '@/features/submissions/queries'
import { AppShell, PageHeader } from '@/components/shared/app-shell'
import { LeaderboardList } from '@/components/shared/leaderboard-list'
import { StatCard } from '@/components/shared/stat-card'
import { Avatar } from '@/components/ui/avatar'
import { ErrorState, Skeleton } from '@/components/ui/states'
import { cn } from '@/lib/utils'

function MedalBadge({ rank }: { rank: 1 | 2 | 3 }) {
  if (rank === 1) {
    return (
      <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <path d="M14 2L20 24L13 24L7 2Z" fill="#2563EB" />
        <path d="M30 2L37 2L31 24L24 24Z" fill="#EF4444" />
        <circle cx="22" cy="31" r="17" fill="url(#gold_grad)" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="22" cy="31" r="14" stroke="#FEF08A" strokeWidth="1" strokeDasharray="2 2" />
        <text x="22" y="37" textAnchor="middle" fill="#78350F" fontSize="18" fontWeight="900" fontFamily="system-ui, sans-serif">1</text>
        <defs>
          <linearGradient id="gold_grad" x1="12" y1="16" x2="32" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="0.5" stopColor="#EAB308" />
            <stop offset="1" stopColor="#CA8A04" />
          </linearGradient>
        </defs>
      </svg>
    )
  }
  if (rank === 2) {
    return (
      <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <path d="M14 2L20 24L13 24L7 2Z" fill="#2563EB" />
        <path d="M30 2L37 2L31 24L24 24Z" fill="#EF4444" />
        <circle cx="22" cy="31" r="17" fill="url(#silver_grad)" stroke="#64748B" strokeWidth="1.5" />
        <circle cx="22" cy="31" r="14" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2 2" />
        <text x="22" y="37" textAnchor="middle" fill="#1E293B" fontSize="18" fontWeight="900" fontFamily="system-ui, sans-serif">2</text>
        <defs>
          <linearGradient id="silver_grad" x1="12" y1="16" x2="32" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8FAFC" />
            <stop offset="0.5" stopColor="#CBD5E1" />
            <stop offset="1" stopColor="#94A3B8" />
          </linearGradient>
        </defs>
      </svg>
    )
  }
  return (
    <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
      <path d="M14 2L20 24L13 24L7 2Z" fill="#2563EB" />
      <path d="M30 2L37 2L31 24L24 24Z" fill="#EF4444" />
      <circle cx="22" cy="31" r="17" fill="url(#bronze_grad)" stroke="#92400E" strokeWidth="1.5" />
      <circle cx="22" cy="31" r="14" stroke="#FDE68A" strokeWidth="1" strokeDasharray="2 2" />
      <text x="22" y="37" textAnchor="middle" fill="#451A03" fontSize="18" fontWeight="900" fontFamily="system-ui, sans-serif">3</text>
      <defs>
        <linearGradient id="bronze_grad" x1="12" y1="16" x2="32" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDBA74" />
          <stop offset="0.5" stopColor="#D97706" />
          <stop offset="1" stopColor="#92400E" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function triggerCelebration() {
  confetti({
    particleCount: 50,
    spread: 65,
    origin: { y: 0.6, x: 0.25 },
    colors: ['#2563eb', '#3b82f6', '#f59e0b', '#ef4444', '#10b981'],
  })
  confetti({
    particleCount: 50,
    spread: 65,
    origin: { y: 0.6, x: 0.75 },
    colors: ['#2563eb', '#3b82f6', '#f59e0b', '#ef4444', '#10b981'],
  })
}

export function LeaderboardPage() {
  const { user } = useAuth()
  const leaderboardQuery = useLeaderboard()

  const entries = leaderboardQuery.data ?? []
  const totalKarya = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.total, 0),
    [entries],
  )

  useEffect(() => {
    track('leaderboard_viewed')
    if (entries.length > 0) {
      const timer = setTimeout(() => {
        triggerCelebration()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [entries.length])

  const loading = leaderboardQuery.isLoading
  const myRank = entries.find((entry) => entry.userId === user?.id)

  const rank1 = entries[0]
  const rank2 = entries[1]
  const rank3 = entries[2]

  const remainingEntries = entries.slice(3)

  const podiumCards = [
    {
      rank: 2 as const,
      title: 'Juara 2',
      entry: rank2,
      bgClass: 'bg-gradient-to-b from-[#b8cae6] to-[#9db4d8] text-white',
      heightClass: 'min-h-[180px] sm:min-h-[210px]',
      orderClass: 'order-2 sm:order-1',
      delay: 0.1,
    },
    {
      rank: 1 as const,
      title: 'Juara 1',
      entry: rank1,
      bgClass: 'bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] text-white shadow-lg shadow-blue-500/20',
      heightClass: 'min-h-[220px] sm:min-h-[260px]',
      orderClass: 'order-1 sm:order-2',
      delay: 0.25,
    },
    {
      rank: 3 as const,
      title: 'Juara 3',
      entry: rank3,
      bgClass: 'bg-gradient-to-b from-[#ca8367] to-[#a75b3d] text-white',
      heightClass: 'min-h-[160px] sm:min-h-[190px]',
      orderClass: 'order-3 sm:order-3',
      delay: 0.4,
    },
  ]

  return (
    <AppShell>
      <PageHeader
        title="Leaderboard"
        subtitle="Ranking kontributor berdasarkan total karya yang terkumpul, sepanjang waktu."
      />

      {leaderboardQuery.isError ? (
        <ErrorState
          message={
            leaderboardQuery.error instanceof Error
              ? leaderboardQuery.error.message
              : 'Tidak diketahui'
          }
          onRetry={() => void leaderboardQuery.refetch()}
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total kontributor"
              value={String(entries.length)}
              icon={Users}
              loading={loading}
              footnote="Punya minimal 1 karya"
            />
            <StatCard
              label="Total karya"
              value={String(totalKarya)}
              icon={Award}
              loading={loading}
              footnote="Terkumpul di sistem"
            />
            <StatCard
              label="Posisi kamu"
              value={myRank ? `#${myRank.rank}` : '—'}
              icon={Medal}
              accent
              loading={loading}
              footnote={myRank ? `${myRank.total} karya` : 'Belum masuk ranking'}
            />
          </section>

          {/* Winner 3 Teratas Section */}
          <section className="mt-6 fin-card p-5 sm:p-6">
            <header className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Trophy className="h-4 w-4" aria-hidden />
                </div>
                <h2 className="text-[18px] font-semibold leading-6 text-ink">Winner 3 teratas</h2>
              </div>
              <button
                type="button"
                onClick={triggerCelebration}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-600 transition-colors hover:bg-brand-100 active:scale-95"
                title="Rayakan!"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Selamatai 🎉
              </button>
            </header>

            <div className="rounded-2xl border border-slate-200/60 bg-[#f4f6fc] p-6 sm:p-8">
              {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:items-end">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <Skeleton className="h-44 w-full rounded-2xl" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mx-auto grid max-w-3xl grid-cols-1 items-end gap-6 sm:grid-cols-3">
                  {podiumCards.map((item) => (
                    <div
                      key={item.rank}
                      className={cn('flex min-w-0 w-full flex-col items-center', item.orderClass)}
                    >
                      {/* Avatar Circle */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 240,
                          damping: 18,
                          delay: item.delay,
                        }}
                        className="relative z-10 -mb-6 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-md ring-4 ring-white sm:h-24 sm:w-24"
                      >
                        {item.entry?.photoUrl ? (
                          <img
                            src={item.entry.photoUrl}
                            alt={item.entry.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : item.entry?.name ? (
                          <Avatar
                            name={item.entry.name}
                            photoUrl={item.entry.photoUrl}
                            size="lg"
                            className="h-full w-full text-xl"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-50 text-blue-500">
                            <User className="h-10 w-10 fill-current opacity-90" />
                          </div>
                        )}
                      </motion.div>

                      {/* Podium Card Bar */}
                      <motion.div
                        initial={{ scaleY: 0.15, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{
                          duration: 0.65,
                          ease: [0.16, 1, 0.3, 1],
                          delay: item.delay,
                        }}
                        style={{ transformOrigin: 'bottom' }}
                        className={cn(
                          'flex w-full flex-col items-center justify-start rounded-2xl px-4 pb-6 pt-9 text-center shadow-xs',
                          item.bgClass,
                          item.heightClass,
                        )}
                      >
                        <MedalBadge rank={item.rank} />
                        <h3
                          className={cn(
                            'mt-2 font-bold tracking-tight',
                            item.rank === 1 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl',
                          )}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-0.5 max-w-full truncate px-2 text-xs font-medium opacity-90 sm:text-sm">
                          {item.entry ? item.entry.name : 'Username id'}
                        </p>
                        {item.entry ? (
                          <span className="mt-2.5 inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
                            {item.entry.total} karya
                          </span>
                        ) : null}
                      </motion.div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Peringkat Lengkap Section (Rank 4+) */}
          <section className="mt-6 fin-card p-5">
            <header className="mb-4 flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Trophy className="h-4 w-4" aria-hidden />
              </div>
              <h2 className="text-[18px] font-semibold leading-6 text-ink">Peringkat lengkap</h2>
            </header>
            <LeaderboardList
              entries={remainingEntries}
              loading={loading}
              highlightUserId={user?.id}
              emptyTitle="Belum ada peringkat 4 ke bawah"
              emptyDescription="Pengguna di peringkat 4 dan seterusnya akan muncul di tabel ini."
            />
          </section>
        </>
      )}
    </AppShell>
  )
}
